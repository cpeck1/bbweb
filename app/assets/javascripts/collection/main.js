/**
 * The Specimen collection module.
 *
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2015 Canadian BioSample Repository (CBSR)
 */
define([
  'angular',
  './CollectionCtrl',
  './CollectionStudyCtrl',
  './ParticipantCtrl',
  './ParticipantEditCtrl',
  './selectStudyDirective',
  './states'
], function(angular,
            CollectionCtrl,
            CollectionStudyCtrl,
            ParticipantCtrl,
            ParticipantEditCtrl,
            selectStudyDirective,
            states) {
  'use strict';

  var module = angular.module('biobank.collection', []);

  module.controller('CollectionCtrl', CollectionCtrl);
  module.controller('CollectionStudyCtrl', CollectionStudyCtrl);
  module.controller('ParticipantCtrl', ParticipantCtrl);
  module.controller('ParticipantEditCtrl', ParticipantEditCtrl);
  module.directive('selectStudy', selectStudyDirective.directive);
  module.controller('SelectStudyCtr', selectStudyDirective.controller);

  module.config(states);

  return module;
});
