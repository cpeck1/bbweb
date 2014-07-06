/** Common helpers */
define(['angular'], function(angular) {
  'use strict';

  var mod = angular.module('admin.studies.ceventTypes.helpers', ['admin.studies.helpers']);

  /**
   * Displays a study annotation type in a modal. The information is displayed in an ng-table.
   *
   */
  mod.service('ceventTypeModalService', [
    '$filter', 'modelObjModalService', 'addTimeStampsService',
    function ($filter, modelObjModalService, addTimeStampsService) {
      return {
        show: function (ceventType, specimenGroups, annotTypes) {
          var title = 'Collection Event Type';

          var sgDataStrings = [];
          ceventType.specimenGroupData.forEach(function (sgItem) {
            sgDataStrings.push(sgItem.name + ' (' + sgItem.maxCount + ': ' + sgItem.amount +
                               ' ' + sgItem.units + ')');
          });

          var atDataStrings = [];
          ceventType.annotationTypeData.forEach(function (atItem) {
            atDataStrings.push(atItem.name + ' (' + (atItem.required ? 'Req' : 'N/R')+ ')');
          });

          var data = [];
          data.push({name: 'Name:', value: ceventType.name});
          data.push({name: 'Recurring:', value: ceventType.recurring});
          data.push({name: 'Specimen Groups (Count: Amount):', value: sgDataStrings.join(", ")});
          data.push({name: 'Annotation Types:', value: atDataStrings.join(", ")});
          data.push({name: 'Description:', value: ceventType.description});
          data = data.concat(addTimeStampsService.get(ceventType));
          modelObjModalService.show(title, data);
        }
      };
    }]);

  mod.service('ceventAnnotTypeEditService', [
    '$state', '$stateParams', 'modalService', 'studyAnnotationTypeService', 'CeventAnnotTypeService',
    function($state, $stateParams, modalService, studyAnnotationTypeService, CeventAnnotTypeService) {
      return {
        edit: function ($scope) {

          var onSubmit = function (annotType) {
            CeventAnnotTypeService.addOrUpdate(annotType)
              .success(function() {
                $state.go('admin.studies.study.collection');
              })
              .error(function(error) {
                studyAnnotationTypeService.onError($scope, error, 'admin.studies.study.collection');
              });
          };

          var onCancel = function () {
            $state.go('admin.studies.study.collection');
          };

          studyAnnotationTypeService.edit($scope, onSubmit, onCancel);
        }
      };
    }]);

  /**
   * Removes a collection event annotation type.
   */
  mod.service('ceventAnnotTypeRemoveService', [
    '$state', '$stateParams', 'stateHelper', 'studyAnnotTypeRemoveService', 'CeventAnnotTypeService', 'modalService',
    function ($state, $stateParams, stateHelper, studyAnnotTypeRemoveService, CeventAnnotTypeService, modalService) {
      return {
        remove: function(ceventAnnotType) {
          studyAnnotTypeRemoveService.remove(
            'Remove Collection Event Annotation Type',
            'Are you sure you want to remove collection event annotation type ' + ceventAnnotType.name + '?',
            function (result) {
              CeventAnnotTypeService.remove(ceventAnnotType)

                .success(function() {
                  stateHelper.reloadAndReinit();
                })

                .error(function(error) {
                  var modalOptions = {
                    closeButtonText: 'Cancel',
                    headerText: 'Remove failed',
                    bodyText: 'Collection event annotation type ' + ceventAnnotType.name + ' cannot be removed: ' + error.message
                  };

                  modalService.showModal({}, modalOptions).then(function (result) {
                    $state.go('admin.studies.study.collection');
                  }, function () {
                    $state.go('admin.studies.study.collection');
                  });
                });
            },
            function() {
              $state.go('admin.studies.study.collection');
            });
        }
      };
    }]);

  /**
   * Common code to add or edit an collection event type.
   */
  mod.service('ceventTypeEditService', [
    '$state', '$stateParams', '$filter', 'stateHelper', 'modalService', 'StudyService', 'CeventTypeService',
    function($state, $stateParams, $filter, stateHelper, modalService, StudyService, CeventTypeService) {

      /*
       * Called when the submission failed due to an error.
       */
      var saveError = function ($scope, ceventType, error) {
        var modalOptions = {
          closeButtonText: 'Cancel',
          actionButtonText: 'OK'
        };

        if (error.message.indexOf("expected version doesn't match current version") > -1) {
          /* concurrent change error */
          modalOptions.headerText = 'Modified by another user';
          modalOptions.bodyText = 'Another user already made changes to this collection event type. Press OK to make ' +
            'your changes again, or Cancel to dismiss your changes.';
        } else {
          /* some other error */
          modalOptions.headerText = sprintf('Cannot %s Collection Event Type', ceventType.id ?  'update' : 'add ');
          modalOptions.bodyText = 'Error: ' + error.message;
        }

        modalService.showModal({}, modalOptions).then(function (result) {
          stateHelper.reloadAndReinit();
        }, function () {
          $state.go('admin.studies.study.collection');
        });
      };

      return {
        edit: function($scope) {
          $scope.form = {
            submit: function(ceventType) {
              // fill in the 'specimenGroupId' field
              $scope.ceventType.specimenGroupData.forEach(function (sgData) {
                var specimenGroup = $filter('getByName')($scope.specimenGroups, sgData.name);
                if (specimenGroup === null) {
                  throw new Error("specimen group not found with name: " + sgData.name);
                }
                sgData.specimenGroupId = specimenGroup.id;
              });

              // fill in the 'annotationTypeId' field
              $scope.ceventType.annotationTypeData.forEach(function (annotTypeData) {
                var annotType = $filter('getByName')($scope.annotTypes, annotTypeData.name);
                if (annotType === null) {
                  throw new Error("annotation type not found with name: " + annotType.name);
                }
                annotTypeData.annotationTypeId = annotType.id;
              });

              CeventTypeService.addOrUpdate(ceventType)
                .success(function() {
                  $state.go('admin.studies.study.collection', { studyId: $scope.study.id });
                })
                .error(function(error) {
                  saveError($scope, ceventType, error);
                });
            },
            cancel: function() {
              $state.go('admin.studies.study.collection', { studyId: $scope.study.id });
            },
            addSpecimenGroup: function () {
              $scope.ceventType.specimenGroupData.push({name:'', specimenGroupId:'', maxCount: '', amount: ''});
            },
            removeSpecimenGroupButtonDisabled: function () {
              return $scope.ceventType.specimenGroupData.length <= 1;
            },
            removeSpecimenGroup: function (sgData) {
              if ($scope.ceventType.specimenGroupData.length <= 1) {
                throw new Error("invalid length for specimen group data");
              }

              var index = $scope.ceventType.specimenGroupData.indexOf(sgData);
              if (index > -1) {
                $scope.ceventType.specimenGroupData.splice(index, 1);
              }
            },
            addAnnotType: function () {
              $scope.ceventType.annotationTypeData.push({name:'', annotationTypeId:'', required: false});
            },
            removeAnnotType: function (atData) {
              if ($scope.ceventType.annotationTypeData.length < 1) {
                throw new Error("invalid length for annotation type data");
              }

              var index = $scope.ceventType.annotationTypeData.indexOf(atData);
              if (index > -1) {
                $scope.ceventType.annotationTypeData.splice(index, 1);
              }
            }
          };

          $scope.specimenGroupNames = [];
          $scope.specimenGroupUnits = {};
          $scope.specimenGroups.forEach(function (sg) {
            $scope.specimenGroupUnits[sg.name] = sg.units;
            $scope.specimenGroupNames.push(sg.name);
          });

          $scope.annotTypeNames = [];
          $scope.annotTypes.forEach(function (annotType) {
            $scope.annotTypeNames.push(annotType.name);
          });
        }
      };
    }]);

  /**
   * Removes a collection event type.
   */
  mod.service('ceventTypeRemoveService', [
    '$state', '$stateParams', 'stateHelper', 'studyAnnotTypeRemoveService', 'CeventTypeService', 'modalService',
    function ($state, $stateParams, stateHelper, studyAnnotTypeRemoveService, CeventTypeService, modalService) {
      return {
        remove: function(ceventType) {
          studyAnnotTypeRemoveService.remove(
            'Remove Collection Event Type',
            'Are you sure you want to remove collection event type ' + ceventType.name + '?',
            function (result) {
              CeventTypeService.remove(ceventType)

                .success(function() {
                  stateHelper.reloadAndReinit();
                })

                .error(function(error) {
                  var modalOptions = {
                    closeButtonText: 'Cancel',
                    headerText: 'Remove failed',
                    bodyText: 'Collection event type ' + ceventType.name + ' cannot be removed: ' + error.message
                  };

                  modalService.showModal({}, modalOptions).then(function (result) {
                    $state.go('admin.studies.study.collection');
                  }, function () {
                    $state.go('admin.studies.study.collection');
                  });
                });
            },
            function() {
              $state.go('admin.studies.study.collection');
            });
        }
      };
    }]);

  return mod;
});
