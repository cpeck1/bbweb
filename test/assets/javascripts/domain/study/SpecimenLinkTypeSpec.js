/**
 * Jasmine test suite
 *
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2015 Canadian BioSample Repository (CBSR)
 */
define([
  'angular',
  'angularMocks',
  'underscore',
  'biobank.testUtils',
  '../annotationTypeDataSharedSpec',
  'biobankApp'
], function(angular, mocks, _, testUtils, annotationTypeDataSharedSpec) {
  'use strict';

  describe('SpecimenLinkType', function() {

    var httpBackend,
        funutils,
        SpecimenLinkType,
        fakeEntities;

    beforeEach(mocks.module('biobankApp', 'biobank.test'));

    beforeEach(inject(function($httpBackend,
                               _funutils_,
                               _SpecimenLinkType_,
                               fakeDomainEntities,
                               extendedDomainEntities) {
      httpBackend      = $httpBackend;
      funutils         = _funutils_;
      SpecimenLinkType = _SpecimenLinkType_;
      fakeEntities     = fakeDomainEntities;
      testUtils.addCustomMatchers();
    }));

    function createEntities() {
      var study,
          processingType,
          specimenGroups,
          annotationTypes,
          sltFromServer;

      study          = fakeEntities.study();
      processingType = fakeEntities.processingType(study);
      sltFromServer  = fakeEntities.specimenLinkType(processingType);

      specimenGroups = _.map(_.range(2), function() {
        return fakeEntities.specimenGroup(study);
      });
      annotationTypes = _.map(_.range(2), function() {
        return fakeEntities.annotationType(study);
      });

      return {
        study:           study,
        processingType:  processingType,
        sltFromServer:   sltFromServer,
        specimenGroups:  specimenGroups,
        annotationTypes: annotationTypes
      };
    }

    /**
     * Creates a {@link SpecimenLinkType} linked to specimen groups and annotation types.
     */
    function entitiesWithLinkedSpecimenLinkType() {
      var entities = createEntities(), slt;

      entities.sltFromServer = fakeEntities.specimenLinkType(
        entities.processingType, {
          inputGroup: entities.specimenGroups[0],
          outputGroup: entities.specimenGroups[1],
          annotationTypes: entities.annotationTypes
        });
      slt = new SpecimenLinkType(entities.sltFromServer, {
        studySpecimenGroups: entities.specimenGroups,
        studyAnnotationTypes: entities.annotationTypes
      });
      return _.extend(entities, { slt: slt });
    }

    it('constructor with no parameters has default values', function() {
      var slt = new SpecimenLinkType();

      expect(slt.isNew()).toBe(true);
      expect(slt.processingTypeId).toBe(null);
      expect(slt.expectedInputChange).toBe(null);
      expect(slt.expectedOutputChange).toBe(null);
      expect(slt.inputCount).toBe(null);
      expect(slt.outputCount).toBe(null);
      expect(slt.inputGroupId).toBe(null);
      expect(slt.outputGroupId).toBe(null);
      expect(slt.annotationTypeData).toBeArrayOfSize(0);
    });

    it('fails when creating from a non object', function() {
      expect(SpecimenLinkType.create(1))
        .toEqual(new Error('invalid object: has the correct keys'));
    });

    it('fails when creating from bad annotation type data', function() {
      var entities = createEntities();

      entities.sltFromServer = fakeEntities.specimenLinkType(
        entities.processingType, {
          inputGroup: entities.specimenGroups[0],
          outputGroup: entities.specimenGroups[1]
        });
      entities.sltFromServer.annotationTypeData = [{ 1: 'abc' }];

      expect(SpecimenLinkType.create(entities.sltFromServer))
        .toEqual(new Error('invalid object from server: bad annotation type data'));
    });

    it('has valid values when creating from server response', function() {
      var entities = entitiesWithLinkedSpecimenLinkType();
      entities.slt.compareToServerEntity(entities.sltFromServer);
    });

    it('can retrieve a specimen link type', function(done) {
      var entities = entitiesWithLinkedSpecimenLinkType();

      httpBackend.whenGET('/studies/' +
                          entities.processingType.id +
                          '/sltypes?slTypeId=' +
                          entities.sltFromServer.id)
        .respond(serverReply(entities.sltFromServer));

      SpecimenLinkType.get(entities.processingType.id, entities.sltFromServer.id).then(function(slt) {
        slt.compareToServerEntity(entities.sltFromServer);
        done();
      });
      httpBackend.flush();
    });

    it('can list specimen link types', function(done) {
      var entities = entitiesWithLinkedSpecimenLinkType();

      httpBackend.whenGET('/studies/' + entities.processingType.id + '/sltypes')
        .respond(serverReply([ entities.sltFromServer ]));

      SpecimenLinkType.list(entities.processingType.id).then(function(list) {
        _.each(list, function (slt) {
          slt.compareToServerEntity(entities.sltFromServer);
        });
        done();
      });
      httpBackend.flush();
    });

    it('can add a specimen link type', function() {
      var entities = createEntities(), slt, cmd;

      entities.sltFromServer = fakeEntities.specimenLinkType(
        entities.processingType, {
          inputGroup: entities.specimenGroups[0],
          outputGroup: entities.specimenGroups[1],
          annotationTypes: entities.annotationTypes
        });

      slt = new SpecimenLinkType(_.omit(entities.sltFromServer, 'id'));
      cmd = sltToAddCommand(slt);

      httpBackend.expectPOST('/studies/' + entities.processingType.id + '/sltypes', cmd)
        .respond(201, serverReply(entities.sltFromServer));

      slt.addOrUpdate().then(function(reply) {
        reply.compareToServerEntity(entities.sltFromServer);
      });
      httpBackend.flush();
    });

    it('can update a specimen link type without annotation types', function() {
      var entities = createEntities(), slt;

      entities.sltFromServer = fakeEntities.specimenLinkType(
        entities.processingType, {
          inputGroup: entities.specimenGroups[0],
          outputGroup: entities.specimenGroups[1]
        });

      slt = new SpecimenLinkType(entities.sltFromServer);

      updateSltSharedBehaviour(slt, entities.sltFromServer, entities.processingType.id);
    });

    it('can update a specimen link type with annotation type data', function() {
      var entities = entitiesWithLinkedSpecimenLinkType();
      updateSltSharedBehaviour(entities.slt, entities.sltFromServer, entities.processingType.id);
    });

    it('should remove a specimen link type', function() {
      var entities = entitiesWithLinkedSpecimenLinkType();

      httpBackend.expectDELETE('/studies/' +
                               entities.slt.processingTypeId + '/sltypes/' +
                               entities.slt.id + '/' +
                               entities.slt.version)
        .respond(201, serverReply(true));

      entities.slt.remove();
      httpBackend.flush();
    });

    it('isNew should be true for a specimen link type with no ID', function() {
      var entities = createEntities(),
          slt = new SpecimenLinkType(_.omit(entities.sltFromServer, 'id'));
      expect(slt.isNew()).toBe(true);
    });

    it('isNew should be false for a specimen link type that has an ID', function() {
      var entities = createEntities(),
          slt = new SpecimenLinkType(entities.sltFromServer);
      expect(slt.isNew()).toBe(false);
    });

    it('processing type ID matches', function() {
      var entities = createEntities(),
          slt = new SpecimenLinkType(entities.sltFromServer);
      expect(slt.processingTypeId).toBe(entities.processingType.id);
    });

    it('should be initialized with annotation type objects', function() {
      var entities = entitiesWithLinkedSpecimenLinkType();

      expect(entities.slt.inputGroup).toEqual(entities.specimenGroups[0]);
      expect(entities.slt.outputGroup).toEqual(entities.specimenGroups[1]);

      _.each(entities.annotationTypes, function(at) {
        expect(entities.slt.getAnnotationTypeDataById(at.id).annotationType).toEqual(at);
      });
    });

    it('allAnnotationTypeDataIds returns valid results', function() {
      var entities = createEntities(), slt, ids;

      entities.sltFromServer = fakeEntities.specimenLinkType(
        entities.processingType, {
          inputGroup: entities.specimenGroups[0],
          outputGroup: entities.specimenGroups[1],
          annotationTypes: entities.annotationTypes
        });

      slt = new SpecimenLinkType(entities.sltFromServer, {
        studySpecimenGroups: entities.specimenGroups,
        studyAnnotationTypes: entities.annotationTypes
      });

      ids = slt.annotationTypeDataIds();
      expect(ids).toBeArrayOfSize(entities.annotationTypes.length);
      expect(ids).toContainAll(_.pluck(entities.annotationTypes, 'id'));
    });

    it('getAnnotationTypeDataById throws an error if there are no annotation type data items', function() {
      var entities = createEntities(),
          slt = new SpecimenLinkType(entities.sltFromServer);
      expect(function () { slt.getAnnotationTypeDataById(entities.annotationTypes[0].id); })
        .toThrow(new Error('no data items'));
    });

    it('getAnnotationTypeDataAsString should return an empty string if there are no annotation type data items',
       function() {
         var entities = createEntities(),
             slt = new SpecimenLinkType(entities.sltFromServer);
         expect(slt.getAnnotationTypeDataAsString()).toBeEmptyString();
       });

    describe('uses annotation type set correctly', function () {

      var study, processingType, annotationTypes, sltFromServer, slt;
      var context = {};

      beforeEach(inject(function(SpecimenLinkType,
                                 fakeDomainEntities) {

        study = fakeDomainEntities.study();
        processingType = fakeDomainEntities.processingType(study);
        annotationTypes = _.map(_.range(2), function() {
          return fakeDomainEntities.annotationType(study);
        });

        sltFromServer = fakeDomainEntities.specimenLinkType(
          processingType,
          { annotationTypes: annotationTypes});

        sltFromServer.annotationTypeData[0].required = true;
        sltFromServer.annotationTypeData[0].required = false;

        slt = new SpecimenLinkType(sltFromServer,
                                   { studyAnnotationTypes: annotationTypes });
        context.parentObj = slt;
        context.annotationTypes = annotationTypes;
        context.fakeEntities = fakeEntities;
      }));

      annotationTypeDataSharedSpec(context);
    });

    function serverReply(obj) {
      return { status: 'success', data: obj };
    }

    function sltToAddCommand(slt) {
      var cmd =  _.extend(_.pick(slt,
                                 'processingTypeId',
                                 'expectedInputChange',
                                 'expectedOutputChange',
                                 'inputCount',
                                 'outputCount',
                                 'inputGroupId',
                                 'outputGroupId'),
                          funutils.pickOptional(slt,
                                            'inputContainerTypeId',
                                                'outputContainerTypeId'));
      cmd.annotationTypeData = slt.getAnnotationTypeData();
      return cmd;
    }

    function sltToUpdateCommand(ceventType) {
      return _.extend(sltToAddCommand(ceventType), {
        id: ceventType.id,
        expectedVersion: ceventType.version
      });
    }

    function updateSltSharedBehaviour(slt, sltFromServer, processingTypeId) {
      var cmd = sltToUpdateCommand(slt);

      httpBackend.expectPUT('/studies/' + processingTypeId + '/sltypes/' + slt.id, cmd)
        .respond(201, serverReply(sltFromServer));

      slt.addOrUpdate().then(function(reply) {
        reply.compareToServerEntity(sltFromServer);
      });
      httpBackend.flush();
    }

  });

});
