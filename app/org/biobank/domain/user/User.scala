package org.biobank.domain.user

import org.biobank.domain.{
  CommonValidations,
  ConcurrencySafeEntity,
  DomainValidation,
  DomainError,
  ValidationKey }
import org.joda.time.DateTime
import org.biobank.infrastructure.JsonUtils._

import play.api.libs.json._
import scalaz.Scalaz._

/** A user of the system.
  */
sealed trait User extends ConcurrencySafeEntity[UserId] {

  /** The user's full name. */
  val name: String

  /** The user's email. Must be unique to the system. */
  val email: String

  /** The user's password */
  val password: String

  /** The string used to salt the password. */
  val salt: String

  /** An optional URL to the user's avatar icon. */
  val avatarUrl: Option[String]

  /** Contains the current state of the object, one of: Registered, Active, Locked. */
  val status: String

  /**
   * Authenticate a user.
   */
  def authenticate(email: String, password: String): DomainValidation[User] = {
    if (this.password == password) this.success
    else DomainError("authentication failure").failureNel
  }

  override def toString =
    s"""|${this.getClass.getSimpleName}: {
        |  id: $id,
        |  version: $version,
        |  timeAdded: $timeAdded,
        |  timeModified: $timeModified,
        |  name: $name,
        |  email: $email,
        |  password: $password,
        |  salt: $salt,
        |  avatarUrl: $avatarUrl,
        |  status: $status
        |}""".stripMargin
}

object User {

  val status: String = "User"

  implicit val userWrites = new Writes[User] {
    def writes(user: User) = {
      var result = Json.obj(
        "id"           -> user.id,
        "version"      -> user.version,
        "timeAdded"    -> user.timeAdded,
        "name"         -> user.name,
        "email"        -> user.email,
        "status"       -> user.status
      )

      result = user.timeModified match {
        case Some(time) => result ++ Json.obj("timeModified" -> Json.toJson(time))
        case None => result
      }

      user.avatarUrl match {
        case Some(url) => result ++ Json.obj("avatarUrl" -> Json.toJson(url))
        case None => result
      }
    }
  }

  // users with duplicate emails are not allowed
  def compareByEmail(a: User, b: User) = (a.email compareToIgnoreCase b.email) < 0

  def compareByName(a: User, b: User) = {
    val nameCompare = a.name compareToIgnoreCase b.name
    if (nameCompare == 0) {
      compareByEmail(a, b)
    } else {
      nameCompare < 0
    }
  }

  def compareByStatus(a: User, b: User) = {
    val statusCompare = a.status compare b.status
    if (statusCompare == 0) {
      compareByName(a, b)
    } else {
      statusCompare < 0
    }
  }
}

trait UserValidations {
  val NameMinLength = 2

  case object PasswordRequired extends ValidationKey

  case object SaltRequired extends ValidationKey

  case object InvalidName extends ValidationKey

  case object InvalidEmail extends ValidationKey

  case object InvalidUrl extends ValidationKey

  val emailRegex = "[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?".r
  val urlRegex = "^((https?|ftp)://|(www|ftp)\\.)[a-z0-9-]+(\\.[a-z0-9-]+)+([/?].*)?$".r

  def validateEmail(email: String): DomainValidation[String] = {
    emailRegex.findFirstIn(email).fold { InvalidEmail.toString.failureNel[String] } { e => email.successNel }
  }

  def validateAvatarUrl(urlOption: Option[String]): DomainValidation[Option[String]] = {
    urlOption.fold {
      none[String].successNel[String]
    } { url  =>
      urlRegex.findFirstIn(url).fold {
        InvalidUrl.toString.failureNel[Option[String]]
      } { e =>
        some(url).successNel
      }
    }
  }
}


/** A user that just registered with the system. This user does not yet have full access
  * the system.
  */
case class RegisteredUser (
  id:           UserId,
  version:      Long,
  timeAdded:    DateTime,
  timeModified: Option[DateTime],
  name:         String,
  email:        String,
  password:     String,
  salt:         String,
  avatarUrl:    Option[String]) extends User with UserValidations {

  override val status: String = RegisteredUser.status

  /* Activates a registered user. */
  def activate: DomainValidation[ActiveUser] = {
    ActiveUser.create(this)
  }
}

/** Factory object. */
object RegisteredUser extends UserValidations {
  import CommonValidations._

  val status: String = "Registered"

  /** Creates a registered user. */
  def create(
    id: UserId,
    version: Long,
    dateTime: DateTime,
    name: String,
    email: String,
    password: String,
    salt: String,
    avatarUrl: Option[String]): DomainValidation[RegisteredUser] = {

    (validateId(id) |@|
      validateAndIncrementVersion(version) |@|
      validateString(name, NameMinLength, InvalidName) |@|
      validateEmail(email) |@|
      validateString(password, PasswordRequired) |@|
      validateString(salt, SaltRequired) |@|
      validateAvatarUrl(avatarUrl)) {
        RegisteredUser(_, _, dateTime, None, _, _, _, _, _)
      }
  }

}

/** A user that has access to the system. */
case class ActiveUser (
  id: UserId,
  version: Long = -1,
  timeAdded: DateTime,
  timeModified: Option[DateTime],
  name: String,
  email: String,
  password: String,
  salt: String,
  avatarUrl: Option[String])
    extends User
    with UserValidations {
  import CommonValidations._

  override val status: String = ActiveUser.status

  def updateName(name: String): DomainValidation[ActiveUser] = {
    validateString(name, NameMinLength, InvalidName).fold(
      err => err.failure,
      x => copy(version = version + 1, name = x).success
    )
  }

  def updateEmail(email: String): DomainValidation[ActiveUser] = {
    validateEmail(email).fold(
      err => err.failure,
      x => copy(version = version + 1, email = x).success
    )
  }

  def updatePassword(password: String, salt: String): DomainValidation[ActiveUser] = {
    validateString(password, PasswordRequired).fold(
      err => err.failure,
      pwd => copy(version = version + 1, password = pwd, salt = salt).success
    )
  }

  def updateAvatarUrl(avatarUrl: Option[String]): DomainValidation[ActiveUser] = {
    validateAvatarUrl(avatarUrl).fold(
      err => err.failure,
      x => copy(version = version + 1, avatarUrl = x).success
    )
  }

  /** Locks an active user. */
  def lock: DomainValidation[LockedUser] = {
    LockedUser.create(this)
  }
}

/** Factory object. */
object ActiveUser extends UserValidations {
  import CommonValidations._

  val status: String = "Active"

  /** Creates an active user from a registered user. */
  def create[T <: User](user: T): DomainValidation[ActiveUser] = {
    (validateId(user.id) |@|
      validateAndIncrementVersion(user.version) |@|
      validateString(user.name, NameMinLength, InvalidName) |@|
      validateEmail(user.email) |@|
      validateString(user.password, PasswordRequired) |@|
      validateString(user.salt, SaltRequired) |@|
      validateAvatarUrl(user.avatarUrl)) {
        ActiveUser(_, _, user.timeAdded, None, _, _, _, _, _)
      }
  }

}

/** A user who no longer has access to the system. */
case class LockedUser (
  id: UserId,
  version: Long = -1,
  timeAdded: DateTime,
  timeModified: Option[DateTime],
  name: String,
  email: String,
  password: String,
  salt: String,
  avatarUrl: Option[String]) extends User {

  override val status: String = LockedUser.status

  /** Unlocks a locked user. */
  def unlock: DomainValidation[ActiveUser] = {
    ActiveUser.create(this)
  }

}

/** Factory object. */
object LockedUser extends UserValidations {
  import CommonValidations._

  val status: String = "Locked"

  /** Creates an active user from a locked user. */
  def create(user: ActiveUser): DomainValidation[LockedUser] = {
    (validateId(user.id) |@|
      validateAndIncrementVersion(user.version) |@|
      validateString(user.name, NameMinLength, InvalidName) |@|
      validateEmail(user.email) |@|
      validateString(user.password, PasswordRequired) |@|
      validateString(user.salt, SaltRequired) |@|
      validateAvatarUrl(user.avatarUrl)) {
        LockedUser(_, _, user.timeAdded, None, _, _, _, _, _)
      }
  }

}

object UserHelper {

  def isUserRegistered(user: User): DomainValidation[RegisteredUser] = {
    user match {
      case registeredUser: RegisteredUser => registeredUser.success
      case _ => DomainError(s"the user is not registered").failureNel
    }
  }

  def isUserActive(user: User): DomainValidation[ActiveUser] = {
    user match {
      case activeUser: ActiveUser => activeUser.success
      case _ => DomainError(s"the user is not active").failureNel
    }
  }

  def isUserLocked(user: User): DomainValidation[LockedUser] = {
    user match {
      case lockedUser: LockedUser => lockedUser.success
      case _ => DomainError(s"the user is not active").failureNel
    }
  }

  def isUserNotLocked(user: User): DomainValidation[User] = {
    user match {
      case lockedUser: LockedUser => DomainError(s"the user is locked").failureNel
      case _ => user.success
    }
  }
}
