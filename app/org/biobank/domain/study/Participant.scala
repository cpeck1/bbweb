package org.biobank.domain.study

import org.biobank.domain.{
  ConcurrencySafeEntity,
  DomainValidation,
  ValidationKey
}
import org.biobank.infrastructure.JsonUtils._

import org.joda.time.DateTime
import play.api.libs.json._
import scalaz.Scalaz._

trait ParticipantValidations {

  case object UniqueIdInvalid extends ValidationKey

  case object UniqueIdRequired extends ValidationKey

}

/** The subject for which a set of specimens were collected from. The subject can be human or non human.
 * A participant belongs to a single study.
 *
 * @param uniqueId A participant has a unique identifier that is used to identify the participant in
 *        the system. This identifier is not the same as the ParticipantId value object
 *        used by the domain model.
 */
case class Participant(studyId:      StudyId,
                       id:           ParticipantId,
                       version:      Long,
                       timeAdded:    DateTime,
                       timeModified: Option[DateTime],
                       uniqueId:     String,
                       annotations:  Set[ParticipantAnnotation])
    extends ConcurrencySafeEntity[ParticipantId]
    with HasStudyId {

  def update(uniqueId: String, annotations: Set[ParticipantAnnotation])
      : DomainValidation[Participant] = {
    val v = Participant.create(this.studyId,
                               this.id,
                               this.version,
                               this.timeAdded,
                               uniqueId,
                               annotations)
    v.map(_.copy(timeModified = Some(DateTime.now)))
  }

  override def toString: String =
    s"""|Participant:{
        |  studyId:      $studyId,
        |  id:           $id,
        |  version:      $version,
        |  timeAdded:    $timeAdded,
        |  timeModified: $timeModified,
        |  uniqueId:     $uniqueId,
        |  annotations:  $annotations,
        |}""".stripMargin
}

object Participant extends ParticipantValidations {
  import org.biobank.domain.CommonValidations._
  import ParticipantAnnotation._

  def create(studyId: StudyId,
             id: ParticipantId,
             version: Long,
             dateTime: DateTime,
             uniqueId: String,
             annotations: Set[ParticipantAnnotation])
      : DomainValidation[Participant] = {
    (validateId(studyId) |@|
      validateId(id) |@|
      validateAndIncrementVersion(version) |@|
      validateString(uniqueId, UniqueIdRequired)) {
      Participant(_, _, _, dateTime, None, _, annotations)
    }
  }

  implicit val participantWrites = Json.writes[Participant]

}
