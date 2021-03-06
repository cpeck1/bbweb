/**
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2015 Canadian BioSample Repository (CBSR)
 */
// Jasmine test suite
//
define([
  'angular',
  'angularMocks',
  'underscore',
  'biobank.testUtils',
  'biobankApp'
], function(angular,
            mocks,
            _,
            testUtils) {
  'use strict';

  describe('SpcLinkTypeViewer', function() {

    var SpcLinkTypeViewer, SpecimenLinkType, fakeEntities, centre;

    beforeEach(mocks.module('biobankApp', 'biobank.test'));

    beforeEach(inject(function(_SpcLinkTypeViewer_,
                               _SpecimenLinkType_,
                               fakeDomainEntities) {
      SpcLinkTypeViewer = _SpcLinkTypeViewer_;
      SpecimenLinkType       = _SpecimenLinkType_;
      fakeEntities   = fakeDomainEntities;

      centre = fakeEntities.centre();
    }));

    function createEntities() {
      var study,
          processingType,
          specimenGroups,
          annotationTypes,
          baseSpcLinkType,
          slt;

      study = fakeEntities.study();
      processingType = fakeEntities.processingType(study);
      specimenGroups = [
        fakeEntities.specimenGroup(study),
        fakeEntities.specimenGroup(study),
      ];
      annotationTypes = [
        fakeEntities.studyAnnotationType(study),
        fakeEntities.studyAnnotationType(study)
      ];
      baseSpcLinkType = fakeEntities.specimenLinkType(processingType, {
        inputGroup: specimenGroups[0],
        outputGroup: specimenGroups[1],
        annotationTypes: annotationTypes
      });
      slt = new SpecimenLinkType(baseSpcLinkType, {
        studySpecimenGroups: specimenGroups,
        studyAnnotationTypes: annotationTypes
      });

      return {
        study:           study,
        processingType:  processingType,
        annotationTypes: annotationTypes,
        baseSpcLinkType: baseSpcLinkType,
        slt:             slt
      };
    }

    it('should open a modal when created', function() {
      var modal = this.$injector.get('$modal'),
          entities = createEntities(),
          viewer;

      spyOn(modal, 'open').and.callFake(function () { return testUtils.fakeModal(); });

      // jshint unused:false
      viewer = new SpcLinkTypeViewer(entities.slt, entities.processingType);
      expect(modal.open).toHaveBeenCalled();
    });

    it('should display valid attributes', function() {
      var EntityViewer = this.$injector.get('EntityViewer'),
          entities = createEntities(),
          attributes,
          viewer;

      spyOn(EntityViewer.prototype, 'addAttribute').and.callFake(function (label, value) {
        attributes.push({label: label, value: value});
      });

      attributes = [];
      viewer = new SpcLinkTypeViewer(entities.slt, entities.processingType);

      expect(attributes).toBeArrayOfSize(10);

      _.each(attributes, function(attr) {
        switch (attr.label) {
        case 'Processing Type':
          expect(attr.value).toBe(entities.processingType.name);
          break;
        case 'Input Group':
          expect(attr.value).toBe(entities.slt.inputGroup.name);
          break;
        case 'Expected input change':
          expect(attr.value).toBe(entities.slt.expectedInputChange + ' ' + entities.slt.inputGroup.units);
          break;
        case 'Input count':
          expect(attr.value).toBe(entities.slt.inputCount);
          break;
        case 'Input Container Type':
          expect(attr.value).toBe('None');
          break;
        case 'Output Group':
          expect(attr.value).toBe(entities.slt.outputGroup.name);
          break;
        case 'Expected output change':
          expect(attr.value).toBe(entities.slt.expectedInputChange + ' ' + entities.slt.outputGroup.units);
          break;
        case 'Output count':
          expect(attr.value).toBe(entities.slt.outputCount);
          break;
        case 'Output Container Type':
          expect(attr.value).toBe('None');
          break;
        case 'Annotation Types':
          expect(attr.value).toBe(entities.slt.getAnnotationTypeDataAsString());
          break;
        default:
          jasmine.getEnv().fail('label is invalid: ' + attr.label);
        }
      });
    });

  });

});
