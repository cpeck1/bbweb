package domain

import scalaz._
import Scalaz._

sealed abstract class Study extends Entity {
  def name: String
  def description: String
  def specimenGroups: List[SpecimenGroup]
}

object Study {
  val invalidVersionMessage = "study %s: expected version %s doesn't match current version %s"

  def invalidVersion(studyId: Identity, expected: Long, current: Long) =
    DomainError(invalidVersionMessage format (studyId, expected, current))

  def requireVersion[T <: Study](study: T, expectedVersion: Option[Long]): DomainValidation[T] = {
    val id = study.id
    val version = study.version

    expectedVersion match {
      case Some(expected) if (version != expected) => invalidVersion(id, expected, version).fail
      case Some(expected) if (version == expected) => study.success
      case None => study.success
    }
  }

  def add(id: StudyId, name: String, description: String): DomainValidation[DisabledStudy] =
    DisabledStudy(id, version = 0L, name, description, specimenGroups = Nil).success

}

case class DisabledStudy(id: StudyId, version: Long = -1, name: String, description: String,
  specimenGroups: List[SpecimenGroup] = Nil)
  extends Study {

}

case class EnabledStudy(id: StudyId, version: Long = -1, name: String, description: String,
  specimenGroups: List[SpecimenGroup] = Nil)
  extends Study {

}

// study commands
case class AddStudy(name: String, description: String)
case class UpdateStudy(id: StudyId, name: String, description: String)
case class EnableStudy(id: StudyId)
case class DisableStudy(id: StudyId)

// specimen group commands
case class AddSpecimenGroup(studyId: StudyId, name: String, description: String,
  amatomicalSourceId: AmatomicalSourceId, preservationId: PreservationId,
  specimenTypeId: SpecimenTypeId)
case class UpdateSpecimenGroup(studyId: StudyId, specimenGroupId: SpecimenGroupId, name: String,
  description: String, amatomicalSourceId: AmatomicalSourceId, preservationId: PreservationId,
  specimenTypeId: SpecimenTypeId)
case class RemoveSpecimenGroup(studyId: StudyId, specimenGroupId: SpecimenGroupId)

// collection event commands
case class AddCollectionEventType(studyId: StudyId, name: String, description: String,
  recurring: Boolean);
case class UpdateCollectionEventType(studyId: StudyId, collectionEventId: CollectionEventId,
  name: String, description: String, recurring: Boolean);