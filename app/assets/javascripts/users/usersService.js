/**
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2015 Canadian BioSample Repository (CBSR)
 */
define(['underscore'], function(_) {
  'use strict';

  usersServiceFactory.$inject = ['$q', '$cookies', '$log', 'biobankApi', 'queryStringService'];

  /**
   * Communicates with the server to get user related information and perform user related commands.
   */
  function usersServiceFactory($q,
                               $cookies,
                               $log,
                               biobankApi,
                               queryStringService) {
    var currentUser = null;
    var token = $cookies['XSRF-TOKEN'];

    var service = {
      getCurrentUser:     getCurrentUser,
      requestCurrentUser: requestCurrentUser,
      login:              login,
      logout:             logout,
      isAuthenticated:    isAuthenticated,
      isAdmin:            isAdmin,
      query:              query,
      getAllUsers:        getAllUsers,
      getUserCounts:      getUserCounts,
      getUsers:           getUsers,
      add:                add,
      updateName:         updateName,
      updateEmail:        updateEmail,
      updatePassword:     updatePassword,
      updateAvatarUrl:    updateAvatarUrl,
      passwordReset:      passwordReset,
      activate:           activate,
      lock:               lock,
      unlock:             unlock
    };

    init();
    return service;

    //-------

    /* If the token is assigned, check that the token is still valid on the server */
    function init() {
      if (token) {
        biobankApi.get('/authenticate')
          .then(function(user) {
            currentUser = user;
            $log.info('Welcome back, ' + currentUser.name);
          })
          .catch(function() {
            /* the token is no longer valid */
            $log.info('Token no longer valid, please log in.');
            token = undefined;
            delete $cookies['XSRF-TOKEN'];
            return $q.reject('Token invalid');
          });
      }
    }

    function uri(userId) {
      var result = '/users';
      if (arguments.length > 0) {
        result += '/' + userId;
      }
      return result;
    }

    function requestCurrentUser() {
      if (isAuthenticated()) {
        return $q.when(currentUser);
      } else {
        return biobankApi.get('/authenticate').then(function(user) {
          currentUser = user;
          return currentUser;
        });
      }
    }

    function getCurrentUser() {
      return currentUser;
    }

    function isAuthenticated() {
      return !!currentUser;
    }

    function isAdmin() {
      // FIXME this needs to be implemented once completed on the server, for now just return true if logged in
      return !!currentUser;
    }

    function changeStatus(user, status) {
      var cmd = {
        id: user.id,
        expectedVersion: user.version
      };
      return biobankApi.post(uri(user.id) + '/' + status, cmd);
    }

    function login(credentials) {
      return biobankApi.post('/login', credentials)
        .then(function(reply) {
          token = reply;
          return biobankApi.get('/authenticate');
        })
        .then(function(user) {
          currentUser = user;
          $log.info('Welcome ' + currentUser.name);
          return currentUser;
        });
    }

    function logout() {
      return biobankApi.post('/logout').then(function() {
        $log.info('Good bye');
        delete $cookies['XSRF-TOKEN'];
        token = undefined;
        currentUser = undefined;
      });
    }

    function query(userId) {
      return biobankApi.get(uri(userId));
    }

    function getAllUsers() {
      return biobankApi.get(uri());
    }

    function getUserCounts() {
      return biobankApi.get(uri() + '/counts');
    }

    /**
     * @param {string} options.nameFilter The filter to use on user names. Default is empty string.
     *
     * @param {string} options.emailFilter The filter to use on user emails. Default is empty string.
     *
     * @param {string} options.status Returns users filtered by status. The following are valid: 'all' to
     * return all users, 'retired' to return only retired users, 'active' to reutrn only active
     * users, and 'locked' to return only locked users. For any other values the response is an error.
     *
     * @param {string} options.sortField Users can be sorted by 'name', 'email' or by 'status'. Values other
     * than these yield an error.
     *
     * @param {int} options.page If the total results are longer than pageSize, then page selects which
     * users should be returned. If an invalid value is used then the response is an error.
     *
     * @param {int} options.pageSize The total number of users to return per page. The maximum page size is
     * 10. If a value larger than 10 is used then the response is an error.
     *
     * @param {string} options.order One of 'asc' or 'desc'. If an invalid value is used then
     * the response is an error.
     *
     * @return A promise. If the promise succeeds then a paged result is returned.
     */
    function getUsers(options) {
      var validKeys = [
        'nameFilter',
        'emailFilter',
        'status',
        'sort',
        'page',
        'pageSize',
        'order'
      ];
      var url = uri();
      var paramsStr = '';

      if (arguments.length) {
        paramsStr = queryStringService.param(options, function (value, key) {
          return _.contains(validKeys, key);
        });
      }

      if (paramsStr) {
        url += paramsStr;
      }

      return biobankApi.get(url);
    }

    function add(newUser, password) {
      var cmd = {
        name:     newUser.name,
        email:    newUser.email,
        password: password
      };
      if (newUser.avatarUrl) {
        cmd.avatarUrl = newUser.avatarUrl;
      }
      return biobankApi.post(uri(), cmd);
    }

    function updateName(user, newName) {
      var cmd = {
        id:              user.id,
        expectedVersion: user.version,
        name:            newName
      };
      return biobankApi.put(uri(user.id) + '/name', cmd);
    }

    function updateEmail(user, newEmail) {
      var cmd = {
        id:              user.id,
        expectedVersion: user.version,
        email:           newEmail
      };
      return biobankApi.put(uri(user.id) + '/email', cmd);
    }

    function updatePassword(user, currentPassword, newPassword) {
      var cmd = {
        id:              user.id,
        expectedVersion: user.version,
        currentPassword: currentPassword,
        newPassword:     newPassword
      };
      return biobankApi.put(uri(user.id) + '/password', cmd);
    }

    function updateAvatarUrl(user, avatarUrl) {
      var cmd = {
        id:              user.id,
        expectedVersion: user.version
      };

      if (avatarUrl) {
        cmd.avatarUrl = avatarUrl;
      }

      return biobankApi.put(uri(user.id) + '/avatarurl', cmd);
    }

    function passwordReset(email) {
      return biobankApi.post('/passreset', { email: email });
    }

    function activate(user) {
      return changeStatus(user, 'activate');
    }

    function lock(user) {
      return changeStatus(user, 'lock');
    }

    function unlock(user) {
      return changeStatus(user, 'unlock');
    }
  }

  return usersServiceFactory;
});
