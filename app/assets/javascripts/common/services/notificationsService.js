/**
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2015 Canadian BioSample Repository (CBSR)
 */
define(['toastr'], function(toastr) {
  'use strict';

  notificationsService.$inject = [];

  /**
   *
   */
  function notificationsService() {
    var service = {
      submitSuccess: submitSuccess,
      success: success,
      error: error
    };
    return service;

    //-------

    function submitSuccess() {
      toastr.options.positionClass = 'toast-bottom-right';
      toastr.success('Your changes were saved.');
    }

    function success(message, title, _timeout) {
      var options = {
        closeButton: true,
        timeOut:  _timeout || 0,
        extendedTimeOut: 0,
        positionClass: 'toast-bottom-right'
      };

      toastr.success(message, title, options);
    }

    function error(message, title, _timeout) {
      var timeout = _timeout || 0;
      var options = {
        closeButton: true,
        timeOut:  timeout,
        extendedTimeOut: (timeout > 0) ? timeout * 2 : 0,
        positionClass: 'toast-bottom-right'
      };

      toastr.error(message, title, options);
    }

  }

  return notificationsService;
});
