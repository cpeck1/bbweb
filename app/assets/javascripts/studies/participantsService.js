/**
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2015 Canadian BioSample Repository (CBSR)
 */
define([], function() {
  'use strict';

  participantsServiceFactory.$inject = ['biobankApi'];

  /**
   *
   */
  function participantsServiceFactory(biobankApi) {
    var service = {
      get:           get,
      getByUniqueId: getByUniqueId,
      addOrUpdate:   addOrUpdate
    };
    return service;

    //-------

    function uri(studyId, participantId) {
      var result = '/studies';
      if (arguments.length <= 0) {
        throw new Error('study id not specified');
      } else {
        result += '/' + studyId + '/participants';

        if (arguments.length > 1) {
          result += '/' + participantId;
        }
      }
      return result;
    }

    function get(studyId, participantId) {
      return biobankApi.get(uri(studyId, participantId));
    }

    function getByUniqueId(studyId, uniqueId) {
      return biobankApi.get(uri(studyId) + '/uniqueId/' + uniqueId);
    }

    function addOrUpdate(participant) {
      var cmd = {
        studyId:     participant.studyId,
        uniqueId:    participant.uniqueId,
        annotations: participant.annotations
      };

      if (participant.id) {
        cmd.id = participant.id;
        cmd.expectedVersion = participant.version;
        return biobankApi.put(uri(participant.studyId, participant.id), cmd);
      } else {
        return biobankApi.post(uri(participant.studyId), cmd);
      }
    }
  }

  return participantsServiceFactory;
});
