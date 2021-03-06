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
  'biobankApp'
], function(angular, mocks, _) {
  'use strict';

  describe('ProcessingType', function() {

    var httpBackend,
        ProcessingType,
        fakeEntities;

    beforeEach(mocks.module('biobankApp', 'biobank.test'));

    beforeEach(inject(function($httpBackend,
                               _ProcessingType_,
                               fakeDomainEntities,
                               extendedDomainEntities) {
      httpBackend         = $httpBackend;
      ProcessingType = _ProcessingType_;
      fakeEntities        = fakeDomainEntities;
    }));

    function uri(/* studyId, processingTypeId, version */) {
      var args = _.toArray(arguments), studyId, processingTypeId, version, result;

      if (arguments.length < 1) {
        throw new Error('study id not specified');
      }

      studyId = args.shift();
      result = '/studies/' + studyId + '/proctypes';

      if (args.length > 0) {
        processingTypeId = args.shift();
        result += '/' + processingTypeId;
      }
      if (args.length > 0) {
        version = args.shift();
        result += '/' + version;
      }
      return result;
    }

    function createEntities(options) {
      var study = fakeEntities.study(),
          serverPt = fakeEntities.processingType(study),
          processingType;

      options = options || {};

      if (options.noPtId) {
        processingType = new ProcessingType(_.omit(serverPt, 'id'));
      } else {
        processingType = new ProcessingType(serverPt);
      }
      return {
        study:          study,
        serverPt:       serverPt,
        processingType: processingType
      };
    }

    it('constructor with no parameters has default values', function() {
      var processingType = new ProcessingType();

      expect(processingType.isNew()).toBe(true);
      expect(processingType.studyId).toBe(null);
      expect(processingType.name).toBe('');
      expect(processingType.description).toBe(null);
      expect(processingType.enabled).toBe(false);
    });

    it('fails when creating from a non object', function() {
      expect(ProcessingType.create(1))
        .toEqual(new Error('invalid object from server: must be a map, has the correct keys'));
    });

    it('has valid values when creating from server response', function() {
      var entities = createEntities();
      entities.processingType = ProcessingType.create(entities.serverPt);
      entities.processingType.compareToServerEntity(entities.serverPt);
    });

    it('can retrieve a processing type', function(done) {
      var entities = createEntities();
      httpBackend.whenGET(uri(entities.study.id) + '?procTypeId=' + entities.serverPt.id)
        .respond(serverReply(entities.serverPt));

      ProcessingType.get(entities.study.id, entities.serverPt.id).then(function(pt) {
        pt.compareToServerEntity(entities.serverPt);
        done();
      });
      httpBackend.flush();
    });

    it('can list processing types', function(done) {
      var entities = createEntities();
      httpBackend.whenGET(uri(entities.study.id)).respond(serverReply([ entities.serverPt ]));
      ProcessingType.list(entities.study.id).then(function(list) {
        _.each(list, function (pt) {
          pt.compareToServerEntity(entities.serverPt);
        });
        done();
      });
      httpBackend.flush();
    });

    it('can add a processing type', function() {
      var entities = createEntities({ noPtId: true }),
          cmd = processingTypeToAddCommand(entities.processingType);

      httpBackend.expectPOST(uri(entities.study.id), cmd)
        .respond(201, serverReply(entities.serverPt));

      entities.processingType.addOrUpdate().then(function(pt) {
        pt.compareToServerEntity(entities.serverPt);
      });
      httpBackend.flush();
    });

    it('can update a processing type', function(done) {
      var entities = createEntities();

      var cmd = processingTypeToUpdateCommand(entities.processingType);
      httpBackend.expectPUT(uri(entities.study.id, entities.processingType.id), cmd)
        .respond(201, serverReply(entities.serverPt));

      entities.processingType.addOrUpdate().then(function(pt) {
        pt.compareToServerEntity(entities.serverPt);
        done();
      });
      httpBackend.flush();
    });

    it('should remove a processing type', function() {
      var entities = createEntities();

      httpBackend.expectDELETE(uri(entities.study.id, entities.processingType.id, entities.processingType.version))
        .respond(201, serverReply(true));

      entities.processingType.remove();
      httpBackend.flush();
    });

    it('isNew should be true for a processing type with no ID', function() {
      var entities = createEntities({ noPtId: true });
      expect(entities.processingType.isNew()).toBe(true);
    });

    it('isNew should be false for a processing type that has an ID', function() {
      var entities = createEntities();
      expect(entities.processingType.isNew()).toBe(false);
    });

    it('study ID matches the study', function() {
      var entities = createEntities();
      expect(entities.processingType.studyId).toBe(entities.study.id);
    });

    function serverReply(obj) {
      return { status: 'success', data: obj };
    }

    function processingTypeToAddCommand(processingType) {
      return {
        studyId:     processingType.studyId,
        name:        processingType.name,
        description: processingType.description,
        enabled:     processingType.enabled
      };
    }

    function processingTypeToUpdateCommand(processingType) {
      return _.extend(processingTypeToAddCommand(processingType), {
        id: processingType.id,
        expectedVersion: processingType.version
      });
    }
  });

});
