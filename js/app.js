'use strict';

angular.module('trackerApp', [ 'trackerApp.filters', 'trackerApp.services', 'trackerApp.directives', 'ngRoute'])

.config([ '$httpProvider', '$routeProvider', '$locationProvider', function($httpProvider, $routeProvider, $locationProvider) {
	
	$routeProvider.when('/login', {
		templateUrl : 'partials/login.html',
		controller : LoginController
	});
	
	$routeProvider.when('/project', {
		templateUrl : 'partials/project/list.html',
		controller : ProjectListController
	});

    $routeProvider.when('/dashboard', {
            templateUrl : 'partials/dashboard/issues.html',
            controller : DashboardIssuesController
        });

    $routeProvider.when('/dashboard/team/:id', {
            templateUrl : 'partials/dashboard/issues.html',
            controller : DashboardIssuesController
        });

	$routeProvider.when('/project/:id', {
		templateUrl : 'partials/project/issues.html',
		controller : ProjectIssuesController
	});
	
	$routeProvider.when('/project/:id/issues', {
		templateUrl : 'partials/project/issues.html',
		controller : ProjectIssuesController
	});
	
	$routeProvider.when('/project/:id/versions', {
		templateUrl : 'partials/project/versions.html',
		controller : ProjectVersionsController
	});
	
	$routeProvider.when('/issue/:id/edit', {
		templateUrl : 'partials/issue/edit.html',
		controller : IssueEditController
	});

    $routeProvider.when('/issue/:id/view', {
        templateUrl : 'partials/issue/view.html',
        controller : IssueViewController
    });
	
	$routeProvider.when('/issue/create', {
		templateUrl : 'partials/issue/create.html',
		controller : IssueCreateController
	});

    $routeProvider.when('/user/issues', {
       templateUrl : 'partials/user/issues.html',
        controller : UserIssuesController
    });
	
	$routeProvider.otherwise({
		redirectTo : 'dashboard'
	});
	
	$locationProvider.hashPrefix('!');
}])

.run(function($rootScope, $location, UserService, ProjectService, ConfigurationService) {
	
	/* Remember path that was originally requested so we can redirect there after login */
	$rootScope.requestedPath = $location.path();
	$location.path("/login");
});