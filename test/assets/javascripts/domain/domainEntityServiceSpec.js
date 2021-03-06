/**
 * Jasmine test suite
 *
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2015 Canadian BioSample Repository (CBSR)
 */
define(['angular', 'angularMocks', 'underscore', 'biobankApp'], function(angular, mocks, _) {
  'use strict';

  describe('Service: domainEntityService', function() {

    var rootScope, domainEntityService, modalService;

    beforeEach(mocks.module('biobankApp', 'biobank.test'));

    beforeEach(inject(function ($rootScope, _domainEntityService_, _modalService_) {
      rootScope = $rootScope;
      domainEntityService = _domainEntityService_;
      modalService = _modalService_;
    }));

    describe('updateErrorModal', function () {

      beforeEach(function () {
        spyOn(modalService, 'showModal').and.callFake(function () {});
      });

      it('opens a modal when error is a version mismatch error', function() {
        /*jshint -W053 */
        var err = { data: { message: new String('expected version doesn\'t match current version') } };
        var domainEntityName = 'entity';
        domainEntityService.updateErrorModal(err, domainEntityName);
        expect(modalService.showModal).toHaveBeenCalledWith({
          templateUrl: '/assets/javascripts/common/modalConcurrencyError.html'
        }, {
          closeButtonText: 'Cancel',
          actionButtonText: 'OK',
          domainType: domainEntityName
        });
      });

      it('opens a modal when error is a string', function() {
        /*jshint -W053 */
        var err = { data: { message: new String('update error') } };
        domainEntityService.updateErrorModal(err, 'entity');
        expect(modalService.showModal).toHaveBeenCalledWith({}, {
          closeButtonText: 'Cancel',
          actionButtonText: 'OK',
          headerHtml: 'Cannot submit this change',
          bodyHtml: 'Error: ' + err.data.message
        });
      });

      it('opens a modal when error is a list', function() {
        var err = { data: { message: [ 'update error1', 'update error2' ] } };
        domainEntityService.updateErrorModal(err, 'entity');
        expect(modalService.showModal).toHaveBeenCalledWith({}, {
          closeButtonText: 'Cancel',
          actionButtonText: 'OK',
          headerHtml: 'Cannot submit this change',
          bodyHtml: 'Error: ' + JSON.stringify(err.data.message)
        });
      });

    });

    describe('removeEntity', function () {
      var q;

      beforeEach(inject(function ($q) {
        q = $q;
      }));

      function removeEntity() {
        return {
          remove: function () {
            return q.when('yyy');
          }
        };
      }

      it('remove works when user confirms the removal', function(done) {
        var header = 'header',
            body = 'body',
            removeFailedHeader = 'removeFailedHeaderHtml',
            removeFailedBody = 'removeFailedBody',
            entity = removeEntity();

        spyOn(entity, 'remove').and.callThrough();
        spyOn(modalService, 'showModal').and.callFake(function () {
          return q.when('xxx');
        });

        domainEntityService.removeEntity(entity,
                                         header,
                                         body,
                                         removeFailedHeader,
                                         removeFailedBody)
          .then(function () {
            expect(entity.remove).toHaveBeenCalled();
            done();
          });
        rootScope.$digest();
      });

      it('works when user cancels the removal', function() {
        var header = 'header',
            body = 'body',
            removeFailedHeader = 'removeFailedHeaderHtml',
            removeFailedBody = 'removeFailedBody',
            entity = removeEntity();

        spyOn(entity, 'remove').and.callThrough();
        spyOn(modalService, 'showModal').and.callFake(function () {
          var deferred = q.defer();
          deferred.reject('xxx');
          return deferred.promise;
        });

        domainEntityService.removeEntity(entity,
                                         header,
                                         body,
                                         removeFailedHeader,
                                         removeFailedBody);

        rootScope.$digest();
        expect(entity.remove).not.toHaveBeenCalled();
      });

      it('displays the removal failed modal', function() {
        var header = 'header',
            body = 'body',
            removeFailedHeader = 'removeFailedHeaderHtml',
            removeFailedBody = 'removeFailedBody',
            entity =  {
              remove: function () {
                var deferred = q.defer();
                deferred.reject('yyy');
                return deferred.promise;
              }
            };

        spyOn(entity, 'remove').and.callThrough();
        spyOn(modalService, 'showModal').and.callFake(function () {
          return q.when('xxx');
        });

        domainEntityService.removeEntity(entity,
                                         header,
                                         body,
                                         removeFailedHeader,
                                         removeFailedBody);
        rootScope.$digest();
        expect(entity.remove).toHaveBeenCalled();
        expect(modalService.showModal.calls.count()).toEqual(2);
      });

    });

  });

});
