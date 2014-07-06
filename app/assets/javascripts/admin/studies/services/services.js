/**
 * User service, exposes user model to the rest of the app.
 */
define(['angular', 'common'], function(angular) {
  'use strict';

  var mod = angular.module('studies.services', ['biobank.common']);

  mod.factory('StudyService', ['$http', 'playRoutes', function($http, playRoutes) {
    return {
      list : function() {
        return playRoutes.controllers.study.StudyController.list().get();
      },
      query: function(id) {
        return playRoutes.controllers.study.StudyController.query(id).get();
      },
      addOrUpdate: function(study) {
        var cmd = {
          name: study.name,
          description: study.description
        };

        if (study.id) {
          cmd.id = study.id;
          cmd.expectedVersion = study.version;

          return playRoutes.controllers.study.StudyController.update(study.id).put(cmd);
        } else {
          return playRoutes.controllers.study.StudyController.add().post(cmd);
        }
      },
      valueTypes : function() {
        return playRoutes.controllers.study.StudyController.valueTypes().get();
      },
      anatomicalSourceTypes : function() {
        return playRoutes.controllers.study.StudyController.anatomicalSourceTypes().get();
      },
      specimenTypes : function() {
        return playRoutes.controllers.study.StudyController.specimenTypes().get();
      },
      preservTypes : function() {
        return playRoutes.controllers.study.StudyController.preservTypes().get();
      },
      preservTempTypes : function() {
        return playRoutes.controllers.study.StudyController.preservTempTypes().get();
      },
      specimenGroupValueTypes : function() {
        return $http.get('/studies/sgvaluetypes');
      }
    };
  }]);

  mod.factory('ParticipantAnnotTypeService', ['playRoutes', function(playRoutes) {
    return {
      getAll: function(studyId) {
        return playRoutes.controllers.study.ParticipantAnnotTypeController.get(studyId).get();
      },
      get: function(studyId, participantAnnotTypeId) {
        return playRoutes.controllers.study.ParticipantAnnotTypeController.get(
          studyId, participantAnnotTypeId).get();
      },
      addOrUpdate: function(annotType) {
        var cmd = {
          studyId:       annotType.studyId,
          name:          annotType.name,
          description:   annotType.description,
          valueType:     annotType.valueType,
          maxValueCount: annotType.maxValueCount,
          options:       annotType.options,
          required:      annotType.required
        };

        if (annotType.id) {
          cmd.id = annotType.id;
          cmd.expectedVersion = annotType.version;

          return playRoutes.controllers.study.ParticipantAnnotTypeController.updateAnnotationType(annotType.id).put(cmd);
        } else {
          return playRoutes.controllers.study.ParticipantAnnotTypeController.addAnnotationType().post(cmd);
        }
      },
      remove: function(annotType) {
        var cmd = {
          studyId: annotType.studyId,
          id: annotType.id,
          expectedVersion: annotType.version
        };
        return playRoutes.controllers.study.ParticipantAnnotTypeController
          .removeAnnotationType(annotType.studyId, annotType.id, annotType.version).delete();
      }
    };
  }]);

  mod.factory('SpecimenGroupService', ['$http', function($http) {
    return {
      getAll: function(studyId) {
        return $http.get('/studies/sgroups/' + studyId);
      },
      get: function(studyId, specimenGroupId) {
        return $http.get('/studies/sgroups/' + studyId + '?sgId=' + specimenGroupId);
      },
      addOrUpdate: function(specimenGroup) {
        var cmd = {
          studyId:                     specimenGroup.studyId,
          name:                        specimenGroup.name,
          description:                 specimenGroup.description,
          units:                       specimenGroup.units,
          anatomicalSourceType:        specimenGroup.anatomicalSourceType,
          preservationType:            specimenGroup.preservationType,
          preservationTemperatureType: specimenGroup.preservationTemperatureType,
          specimenType:                specimenGroup.specimenType
        };

        if (specimenGroup.id) {
          cmd.id = specimenGroup.id;
          cmd.expectedVersion = specimenGroup.version;
          return $http.put('/studies/sgroups/' + specimenGroup.id, cmd);
        } else {
          return $http.post('/studies/sgroups', cmd);
        }
      },
      remove: function(specimenGroup) {
        return $http.delete(
          '/studies/sgroups/' + specimenGroup.studyId +
            '/' + specimenGroup.id +
            '/' + specimenGroup.version);
      }
    };
  }]);

  mod.factory('CeventTypeService', [
    '$http', 'SpecimenGroupService',
    function($http, SpecimenGroupService) {
      return {
        getAll: function(studyId) {
          return $http.get('/studies/cetypes/' + studyId);
        },
        get: function(studyId, collectionEventTypeId) {
          return $http.get('/studies/cetypes/' + studyId + '?cetId=' + collectionEventTypeId);
        },
        addOrUpdate: function(collectionEventType) {
          var cmd = {
            studyId:            collectionEventType.studyId,
            name:               collectionEventType.name,
            description:        collectionEventType.description,
            recurring:          collectionEventType.recurring,
            specimenGroupData:  collectionEventType.specimenGroupData,
            annotationTypeData: collectionEventType.annotationTypeData
          };

          if (collectionEventType.id) {
            cmd.id = collectionEventType.id;
            cmd.expectedVersion = collectionEventType.version;
            return $http.put('/studies/cetypes/' + collectionEventType.id, cmd);
          } else {
            return $http.post('/studies/cetypes', cmd);
          }
        },
        remove: function(collectionEventType) {
          return $http.delete(
            '/studies/cetypes/' + collectionEventType.studyId +
              '/' + collectionEventType.id +
              '/' + collectionEventType.version);
        }
      };
    }]);

  mod.factory('CeventAnnotTypeService', ['$http', function($http) {
    return {
      getAll: function(studyId) {
        return $http.get('/studies/ceannottype/' + studyId);
      },
      get: function(studyId, collectionEventTypeId) {
        return $http.get('/studies/ceannottype/' + studyId + '?annotTypeId=' + collectionEventTypeId);
      },
      addOrUpdate: function(annotType) {
        var cmd = {
          studyId:       annotType.studyId,
          name:          annotType.name,
          description:   annotType.description,
          valueType:     annotType.valueType,
          maxValueCount: annotType.maxValueCount,
          options:       annotType.options
        };

        if (annotType.id) {
          cmd.id = annotType.id;
          cmd.expectedVersion = annotType.version;
          return $http.put('/studies/ceannottype/' + annotType.id, cmd);
        } else {
          return $http.post('/studies/ceannottype', cmd);
        }
      },
      remove: function(annotType) {
        return $http.delete(
          '/studies/ceannottype/' + annotType.studyId +
            '/' + annotType.id +
            '/' + annotType.version);
      }
    };
  }]);
});

