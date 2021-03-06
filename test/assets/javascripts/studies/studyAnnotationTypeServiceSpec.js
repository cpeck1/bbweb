/**
 * Jasmine test suite for:
 *
 *   - ceventAnnotationTypesService
 *   - participantAnnotationTypesService
 *   - spcLinkAnnotationTypesService
 *
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2015 Canadian BioSample Repository (CBSR)
 */
define([
  'angular',
  'angularMocks',
  'underscore',
  'biobankApp',
  'biobankTest'
], function(angular, mocks, _) {
  'use strict';

  /**
   * Suite for ceventAnnotationTypesService
   */
  describe('service: ceventAnnotationTypesService', function () {

    var context = {};

    beforeEach(mocks.module('biobankApp', 'biobank.test'));

    beforeEach(inject(function ($httpBackend,
                                fakeDomainEntities,
                                extendedDomainEntities,
                                CollectionEventAnnotationType,
                                ceventAnnotationTypesService) {
      var fakeEntities = fakeDomainEntities;

      context.httpBackend            = $httpBackend;
      context.annotationTypeType     = CollectionEventAnnotationType;
      context.studyAnnotationTypesService = ceventAnnotationTypesService;
      context.study                  = fakeEntities.study();
      context.annotationTypeUriPart       = 'ceannottypes';

      //context.serverAnnotationType = fakeEntities.studyAnnotationType(context.study, { required: false });
      context.serverAnnotationType = fakeEntities.studyAnnotationType(context.study);
    }));

    sharedBehaviourForStudyAnnotationTypes(context);
  });

  /**
   * Suite for spcLinkAnnotationTypesService
   */
  describe('service: spcLinkAnnotationTypesService', function () {

    var context = {};

    beforeEach(mocks.module('biobankApp', 'biobank.test'));

    beforeEach(inject(function ($httpBackend,
                                fakeDomainEntities,
                                extendedDomainEntities,
                                SpecimenLinkAnnotationType,
                                spcLinkAnnotationTypesService) {
      var fakeEntities = fakeDomainEntities;

      context.httpBackend            = $httpBackend;
      context.annotationTypeType     = SpecimenLinkAnnotationType;
      context.studyAnnotationTypesService = spcLinkAnnotationTypesService;
      context.study                  = fakeEntities.study();
      context.annotationTypeUriPart       = 'slannottypes';

      //context.serverAnnotationType = fakeEntities.studyAnnotationType(context.study, { required: false });
      context.serverAnnotationType = fakeEntities.studyAnnotationType(context.study);
    }));

    sharedBehaviourForStudyAnnotationTypes(context);
  });

  /**
   * Suite for participantAnnotationTypesService
   */
  describe('service: participantAnnotationTypesService', function () {

    var context = {};

    beforeEach(mocks.module('biobankApp', 'biobank.test'));

    beforeEach(inject(function ($httpBackend,
                                fakeDomainEntities,
                                extendedDomainEntities,
                                ParticipantAnnotationType,
                                participantAnnotationTypesService) {
      var fakeEntities = fakeDomainEntities;

      context.httpBackend            = $httpBackend;
      context.annotationTypeType     = ParticipantAnnotationType;
      context.studyAnnotationTypesService = participantAnnotationTypesService;
      context.study                  = fakeEntities.study();
      context.annotationTypeUriPart       = 'pannottypes';

      context.serverAnnotationType = fakeEntities.studyAnnotationType(context.study, { required: true });
    }));

    sharedBehaviourForStudyAnnotationTypes(context);
  });

  /**
   * Shared spec for all 3 services listed above.
   */
  function sharedBehaviourForStudyAnnotationTypes(context) {

    describe('(shared)', function() {

      var httpBackend, studyAnnotationTypesService, AnnotationTypeType;
      var study, serverAnnotationType, serverAnnotationTypeNoId;

      function uri(annotationTypeId, version) {
        var result = '/studies/' + context.study.id + '/' + context.annotationTypeUriPart;
        if (arguments.length > 0) {
          result += '/' + annotationTypeId;
        }
        if (arguments.length > 1) {
          result += '/' + version;
        }
        return result;
      }

      beforeEach(function () {
        httpBackend            = context.httpBackend;
        studyAnnotationTypesService = context.studyAnnotationTypesService;
        AnnotationTypeType     = context.annotationTypeType;
        study                  = context.study;
        serverAnnotationType        = context.serverAnnotationType;
        serverAnnotationTypeNoId    = _.omit(context.serverAnnotationType, 'id', 'version');
      });

      afterEach(function() {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
      });

      it('should have the following functions', function () {
        expect(studyAnnotationTypesService.addOrUpdate).toBeFunction();
        expect(studyAnnotationTypesService.remove).toBeFunction();
      });

      it('should allow adding an annotation type', function() {
        var annotationType = new AnnotationTypeType(serverAnnotationTypeNoId);
        var cmd = getAddCommand(annotationType);

        var expectedResult = {status: 'success', data: 'success'};
        httpBackend.expectPOST(uri(), cmd).respond(201, expectedResult);

        studyAnnotationTypesService.addOrUpdate(annotationType).then(function(reply) {
          expect(reply).toEqual('success');
        });
        httpBackend.flush();
      });

      it('should allow updating an annotation type', function() {
        var annotationType = new AnnotationTypeType(serverAnnotationType);
        var cmd = getUpdateCommand(annotationType);

        var expectedResult = {status: 'success', data: 'success'};

        httpBackend.expectPUT(uri(annotationType.id), cmd).respond(201, expectedResult);

        studyAnnotationTypesService.addOrUpdate(annotationType).then(function(reply) {
          expect(reply).toEqual('success');
        });
        httpBackend.flush();
      });

      it('should remove an annotation type', function() {
        var annotationType = new AnnotationTypeType(serverAnnotationType);
        httpBackend.expectDELETE(uri(annotationType.id, annotationType.version)).respond(201);
        studyAnnotationTypesService.remove(annotationType);
        httpBackend.flush();
      });

      function getAddCommand(annotationType) {
        var result = _.pick(annotationType, 'studyId', 'name', 'valueType', 'options');
        _.each(['description', 'maxValueCount', 'required'], function(optionalKey) {
          if (!_.isUndefined(annotationType[optionalKey])) {
            result[optionalKey] = annotationType[optionalKey];
          }
        });
      }

      function getUpdateCommand(annotationType) {
        return _.extend(getAddCommand(annotationType), { expectedVersion: annotationType.version });
      }

    });

  }

});
