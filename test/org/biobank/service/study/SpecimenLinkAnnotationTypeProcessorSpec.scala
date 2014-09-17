package org.biobank.service

import org.biobank.fixture._
import org.biobank.domain._
import org.biobank.domain.study._
import org.biobank.infrastructure.command.StudyCommands._
import org.biobank.infrastructure.event.StudyEvents._

import org.slf4j.LoggerFactory
import org.joda.time.DateTime
import akka.pattern.ask
import org.scalatest.OptionValues._
import org.scalatest.Tag
import org.scalatest.BeforeAndAfterEach
import scalaz._
import scalaz.Scalaz._

/**
  * Tests for actor SpecimenLinkAnnotationTypeProcessorSpec. These are written using ScalaTest.
  *
  */
class SpecimenLinkAnnotationTypeProcessorSpec extends StudiesProcessorFixture {
  import org.biobank.TestUtils._

  private val log = LoggerFactory.getLogger(this.getClass)

  val nameGenerator = new NameGenerator(this.getClass)

  var disabledStudy: DisabledStudy = null

  // create the study to be used for each tests*
  override def beforeEach: Unit = {
    disabledStudy = factory.createDisabledStudy
    studyRepository.put(disabledStudy)
    ()
  }

  "A study processor" can {

    "add a specimen link annotation type" in {
      val annotType = factory.createSpecimenLinkAnnotationType

      val cmd = AddSpecimenLinkAnnotationTypeCmd(
        annotType.studyId.id, annotType.name, annotType.description, annotType.valueType,
        annotType.maxValueCount, annotType.options)
      val v = ask(studiesProcessor, cmd)
        .mapTo[DomainValidation[SpecimenLinkAnnotationTypeAddedEvent]]
        .futureValue

      v shouldSucceed { event =>
        event shouldBe a[SpecimenLinkAnnotationTypeAddedEvent]
        event should have(
          'studyId (annotType.studyId.id),
          'name (annotType.name),
          'description (annotType.description),
          'valueType (annotType.valueType),
          'maxValueCount (annotType.maxValueCount)
        )

        event.options should not be (None)
        event.options.value should have size annotType.options.value.size
        annotType.options.value.map { item =>
          event.options.value should contain (item)
        }

        specimenLinkAnnotationTypeRepository.allForStudy(disabledStudy.id) should have size 1
        specimenLinkAnnotationTypeRepository.withId(
          disabledStudy.id, AnnotationTypeId(event.annotationTypeId)) shouldSucceed { at =>
          at.version should be(0)
          checkTimeStamps(at, DateTime.now, None)
        }
      }
    }

    "not add a specimen link annotation type to a study that does not exist" in {
      val study2 = factory.createDisabledStudy
      val annotType = factory.createSpecimenLinkAnnotationType

      val cmd = AddSpecimenLinkAnnotationTypeCmd(
        annotType.studyId.id, annotType.name, annotType.description, annotType.valueType,
        annotType.maxValueCount, annotType.options)
      val v = ask(studiesProcessor, cmd)
        .mapTo[DomainValidation[SpecimenLinkAnnotationTypeAddedEvent]]
        .futureValue
       v shouldFail s"${study2.id.id}.*not found"
    }

    "not add a specimen link annotation type if the name already exists" in {
      val annotType = factory.createSpecimenLinkAnnotationType
      specimenLinkAnnotationTypeRepository.put(annotType)

      val cmd = AddSpecimenLinkAnnotationTypeCmd(
        annotType.studyId.id, annotType.name, annotType.description, annotType.valueType,
        annotType.maxValueCount, annotType.options)
      val v = ask(studiesProcessor, cmd)
        .mapTo[DomainValidation[SpecimenLinkAnnotationTypeAddedEvent]]
        .futureValue
      v shouldFail "name already exists"
    }

    "update a specimen link annotation type" in {
      val annotType = factory.createSpecimenLinkAnnotationType
      specimenLinkAnnotationTypeRepository.put(annotType)

      val annotType2 = factory.createSpecimenLinkAnnotationType

      val cmd = UpdateSpecimenLinkAnnotationTypeCmd(
        annotType.studyId.id, annotType.id.id, annotType.version, annotType2.name,
        annotType2.description, annotType2.valueType, annotType2.maxValueCount, annotType2.options)
      val v = ask(studiesProcessor, cmd)
        .mapTo[DomainValidation[SpecimenLinkAnnotationTypeUpdatedEvent]]
        .futureValue

      v shouldSucceed { event =>
        event shouldBe a[SpecimenLinkAnnotationTypeUpdatedEvent]
        event should have(
          'studyId (annotType.studyId.id),
          'version (annotType.version + 1),
          'name (annotType2.name),
          'description (annotType2.description),
          'valueType (annotType2.valueType),
          'maxValueCount (annotType2.maxValueCount)
        )

        event.options should not be (None)
        event.options.value should have size annotType2.options.value.size
        // verify each option
        annotType2.options.value.map { item =>
          event.options.value should contain (item)
        }

        specimenLinkAnnotationTypeRepository.allForStudy(disabledStudy.id) should have size 1
        specimenLinkAnnotationTypeRepository.withId(
          disabledStudy.id, AnnotationTypeId(event.annotationTypeId)) shouldSucceed { at =>
          at.version should be(1)
          checkTimeStamps(at, annotType.addedDate, DateTime.now)
        }
      }
    }

    "not update a specimen link annotation type to name that already exists" in {
      val annotType = factory.createSpecimenLinkAnnotationType
      specimenLinkAnnotationTypeRepository.put(annotType)

      val annotType2 = factory.createSpecimenLinkAnnotationType
      specimenLinkAnnotationTypeRepository.put(annotType2)

      val dupliacteName = annotType.name

      val cmd = UpdateSpecimenLinkAnnotationTypeCmd(
        annotType2.studyId.id, annotType2.id.id, annotType2.version, dupliacteName,
        annotType2.description, annotType2.valueType, annotType2.maxValueCount, annotType2.options)
      val v = ask(studiesProcessor, cmd)
        .mapTo[DomainValidation[SpecimenLinkAnnotationTypeUpdatedEvent]]
        .futureValue
      v shouldFail "name already exists"
    }

    "not update a specimen link annotation type to the wrong study" in {
      val annotType = factory.createSpecimenLinkAnnotationType
      specimenLinkAnnotationTypeRepository.put(annotType)

      val study2 = factory.createDisabledStudy
      studyRepository.put(study2)

      val cmd = UpdateSpecimenLinkAnnotationTypeCmd(
        study2.id.id, annotType.id.id, annotType.version, annotType.name,
        annotType.description, annotType.valueType, annotType.maxValueCount, annotType.options)
      val v = ask(studiesProcessor, cmd)
        .mapTo[DomainValidation[SpecimenLinkAnnotationTypeUpdatedEvent]]
        .futureValue
      v shouldFail "study does not have annotation type"
    }

    "not update a specimen link annotation type with an invalid version" in {
      val annotType = factory.createSpecimenLinkAnnotationType
      specimenLinkAnnotationTypeRepository.put(annotType)

      val cmd = UpdateSpecimenLinkAnnotationTypeCmd(
        annotType.studyId.id, annotType.id.id, annotType.version - 1, annotType.name,
        annotType.description, annotType.valueType, annotType.maxValueCount, annotType.options)
      val v = ask(studiesProcessor, cmd)
        .mapTo[DomainValidation[SpecimenLinkAnnotationTypeUpdatedEvent]]
        .futureValue
      v shouldFail "doesn't match current version"
    }

    "remove a specimen link annotation type" in {
      val annotType = factory.createSpecimenLinkAnnotationType
      specimenLinkAnnotationTypeRepository.put(annotType)

      val cmd = RemoveSpecimenLinkAnnotationTypeCmd(
        annotType.studyId.id, annotType.id.id, annotType.version)
      val v = ask(studiesProcessor, cmd)
        .mapTo[DomainValidation[SpecimenLinkAnnotationTypeRemovedEvent]]
        .futureValue

      v shouldSucceed { event =>
        event shouldBe a[SpecimenLinkAnnotationTypeRemovedEvent]
        event.studyId should be (annotType.studyId.id)
        event.annotationTypeId should be (annotType.id.id)
      }
    }

    "not remove a specimen link annotation type with invalid version" in {
      val annotType = factory.createSpecimenLinkAnnotationType
      specimenLinkAnnotationTypeRepository.put(annotType)

      val cmd = RemoveSpecimenLinkAnnotationTypeCmd(
        annotType.studyId.id, annotType.id.id, annotType.version - 1)
      val v = ask(studiesProcessor, cmd)
        .mapTo[DomainValidation[SpecimenLinkAnnotationTypeRemovedEvent]]
        .futureValue
      v shouldFail "expected version doesn't match current version"
    }

  }

}