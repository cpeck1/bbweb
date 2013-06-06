package infrastructure.commands

import domain.study.CollectionEventId
import domain.AnatomicalSourceType._
import domain.PreservationType._
import domain.PreservationTemperatureType._
import domain.SpecimenType._

// study commands
case class AddStudyCmd(name: String, description: String)
case class UpdateStudyCmd(studyId: String, expectedVersion: Option[Long], name: String,
  description: String)
case class EnableStudyCmd(studyId: String, expectedVersion: Option[Long])
case class DisableStudyCmd(studyId: String, expectedVersion: Option[Long])

// specimen group commands
sealed trait SpecimenGroupCommand {
  val studyId: String
}
case class AddSpecimenGroupCmd(studyIdentity: String, name: String, description: String, units: String,
  anatomicalSourceType: AnatomicalSourceType, preservationType: PreservationType,
  preservationTemperatureType: PreservationTemperatureType,
  specimenType: SpecimenType) extends { val studyId = studyIdentity } with SpecimenGroupCommand
case class UpdateSpecimenGroupCmd(studyIdentity: String, specimenGroupId: String,
  expectedVersion: Option[Long], name: String, description: String, units: String,
  anatomicalSourceType: AnatomicalSourceType, preservationType: PreservationType,
  preservationTemperatureType: PreservationTemperatureType,
  specimenType: SpecimenType) extends { val studyId = studyIdentity } with SpecimenGroupCommand
case class RemoveSpecimenGroupCmd(studyIdentity: String, specimenGroupId: String,
  expectedVersion: Option[Long]) extends { val studyId = studyIdentity } with SpecimenGroupCommand

// collection event commands
sealed trait CollectionEventTypeCommand {
  val studyId: String
}
case class AddCollectionEventTypeCmd(studyIdentity: String, expectedVersion: Option[Long],
  name: String, description: String,
  recurring: Boolean) extends { val studyId = studyIdentity } with CollectionEventTypeCommand
case class UpdateCollectionEventTypeCmd(studyIdentity: String, collectionEventTypeId: String,
  expectedVersion: Option[Long], name: String, description: String,
  recurring: Boolean) extends { val studyId = studyIdentity } with CollectionEventTypeCommand
case class RemoveCollectionEventTypeCmd(studyIdentity: String, collectionEventTypeId: String,
  expectedVersion: Option[Long]) extends { val studyId = studyIdentity } with CollectionEventTypeCommand
case class AddSpecimenGroupToCollectionEventTypeCmd(studyIdentity: String, collectionEventTypeId: String,
  expectedVersion: Option[Long], specimenGroupId: String) extends { val studyId = studyIdentity } with CollectionEventTypeCommand
case class RemoveSpecimenGroupFromCollectionEventTypeCmd(studyIdentity: String, collectionEventTypeId: String,
  expectedVersion: Option[Long], specimenGroupId: String) extends { val studyId = studyIdentity } with CollectionEventTypeCommand
case class AddAnnotationToCollectionEventTypeCmd(studyIdentity: String, collectionEventTypeId: String,
  expectedVersion: Option[Long], collectionEventAnnotationTypeId: String) extends { val studyId = studyIdentity } with CollectionEventTypeCommand
case class RemoveAnnotationFromCollectionEventTypeCmd(studyIdentity: String, collectionEventTypeId: String,
  expectedVersion: Option[Long], collectionEventAnnotationTypeId: String) extends { val studyId = studyIdentity } with CollectionEventTypeCommand