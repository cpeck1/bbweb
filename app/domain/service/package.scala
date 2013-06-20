package domain

import infrastructure._
import org.slf4j.Logger

import scalaz._
import scalaz.Scalaz._

package service {

  /**
   * All Domain Services extend this trait.
   *
   * @author Nelson Loyola
   */
  trait CommandHandler {

    type ProcessResult = PartialFunction[Any, DomainValidation[Any]]

    /**
     * A partial function to handle each command. The input is a Tuple3 consisting of:
     *
     *  1. The command to handle.
     *  2. The study entity the command is associated with,
     *  3. The event message listener to be notified if the command is successful.
     *
     *  If the command is invalid, then the method throws an Error exception.
     */
    def process: ProcessResult

  }

  object CommandHandler {

    def logMethod(
      log: Logger,
      methodName: String,
      cmd: Any,
      validation: DomainValidation[Any]) {
      if (log.isDebugEnabled) {
        log.debug("%s: %s".format(methodName, cmd))
        validation match {
          case Success(item) =>
            log.debug("%s: %s".format(methodName, item))
          case Failure(msglist) =>
            log.debug("%s: { msg: %s }".format(methodName, msglist.head))
        }
      }
    }

  }

}