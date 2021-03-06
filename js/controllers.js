function LoginController($scope, $rootScope, $location, UserService, ConfigurationService, ProjectService) {
	
	$scope.submitting = false;

	var login = function(baseUrl, apiKey) {

		delete $scope.error;
		$scope.submitting = true;

		ConfigurationService.setRestServiceBase(baseUrl);
		ConfigurationService.setApiKey(apiKey);

		UserService.getCurrent()
			.success(function(data) {

				$rootScope.user = data.user;

				ProjectService.getTopLevelProjects().then(
					function(projects) {

						$rootScope.topLevelProjects = projects;
						$scope.submitting = false;

                        /* Redirect back to originally requested path if possible */
						if (angular.isDefined($rootScope.requestedPath) && $rootScope.requestedPath != "/login") {
							$location.path($rootScope.requestedPath);
						} else {
							$location.path("/");
						}

					}, function(response) {

						$scope.error = "Getting toplevel projects failed";
						console.lerror(response);
						$scope.submitting = false;
					}
				);
			})
			.error(function(data, status, headers, config) {
				$scope.error = "Login failed with status " + status;
				$scope.submitting = false;
			});
	};
	
	/* Try login based on cookie */
	$scope.baseUrl = $.cookie('baseUrl');
	$scope.apiKey = $.cookie('apiKey');
	if (baseUrl !== undefined && apiKey !== undefined) {
		login($scope.baseUrl, $scope.apiKey);
	}
	
	$scope.submit = function() {
		$.cookie('baseUrl', $scope.baseUrl, { expires: 365 });
		$.cookie('apiKey', $scope.apiKey, { expires: 365 });
		login($scope.baseUrl, $scope.apiKey);
	};
}


function ProjectListController($scope, ProjectService) {
}


function ProjectVersionsController($scope, $rootScope, $routeParams, ProjectService) {
	
	ProjectService.get($routeParams.id).then(function(project) {
		$rootScope.project = project;
	});
	
	ProjectService.getVersions($routeParams.id).then(function(versions) {
		$scope.versions = versions;
	});
}

function DashboardIssuesController($scope, $rootScope, $window, $routeParams, $location, ProjectService, IssueService, GroupsService, UserService) {

	//ProjectService.get($routeParams.id).then(function(project) {
	//	$rootScope.project = project;
	//});
    $scope.selected = [];

    var updateSelected = function(action, id) {
      if (action === 'add' && $scope.selected.indexOf(id) === -1) {
        $scope.selected.push(id);
      }
      if (action === 'remove' && $scope.selected.indexOf(id) !== -1) {
        $scope.selected.splice($scope.selected.indexOf(id), 1);
      }
    };

    $scope.updateSelection = function($event, id) {
      var checkbox = $event.target;
      var action = (checkbox.checked ? 'add' : 'remove');
      updateSelected(action, id);
    };

    $scope.selectAll = function($event) {
      var checkbox = $event.target;
      var action = (checkbox.checked ? 'add' : 'remove');
      for ( var i = 0; i < $scope.entities.length; i++) {
        var entity = $scope.entities[i];
        updateSelected(action, entity.id);
      }
    };

    $scope.getSelectedClass = function(entity) {
      return $scope.isSelected(entity.id) ? 'bg-info' : '';
    };

    $scope.isSelected = function(id) {
      return $scope.selected.indexOf(id) >= 0;
    };

    //something extra I couldn't resist adding :)
    $scope.isSelectedAll = function() {
      return $scope.selected.length === $scope.entities.length;
    };

    UserService.getAllUsers().then(function(users) {
   		$scope.users = users;
   	});

    IssueService.getIssueStatuses().then(function(statuses) {
   		$scope.statuses = statuses;
   	});

    GroupsService.getAllGroups(true).then(function(groups) {
        $scope.groups = groups;
    });

    $scope.params = $routeParams;
    $scope.orderProp = 'id';


	$scope.loadIssuesByStatus = function(issuesName,statusId,limit) {

		delete $scope[issuesName];

        var config  = {
            params : {
                limit : limit
            }
        }
        GroupsService.addTeamFilterToParams($routeParams.id).then(function(params){
            var query = '?' + params + '&f[]=status_id&op[status_id]=%3D&v[status_id][]=' + statusId;
            IssueService.find(config,query)
          			.then(function(data) {
                        var update = { oldest: 0, newest: 1000000000};
                        angular.forEach(data.issues, function(value, key) {
                            data.issues[key]['isChecked'] = false;
                            data.issues[key]['last_updated'] = Math.floor(((new Date()).getTime() - Date.parse(data.issues[key].updated_on)) / 1000)
                            if (data.issues[key]['last_updated'] >= update.oldest) update.oldest = data.issues[key]['last_updated'];
                            if (data.issues[key]['last_updated'] < update.newest) update.newest = data.issues[key]['last_updated'];
                        });
                          $scope[issuesName] = {
          					'entries' : data.issues,
          					'pagination' : {
          						'offset' : data.offset,
          						'total' : data.total_count,
          						'limit' : data.limit,
                                'stats' : {
                                    oldest_update : update.oldest,
                                    newest_update : update.newest
                                }
          					}
          				};
          			});
        });

	};

	$scope.deleteIssue = function(issue) {

		if ($window.confirm('Are you sure you wish to delete the issue?')) {
			IssueService['delete'](issue.id).then(function() {
				$scope.loadIssues();
			});
		}
	};

    $scope.editTags = function(issue) {
        alert('Edit tags not implemented!');
   	};

	$scope['delete'] = function(id) {

		if ($window.confirm('Are you sure you wish to delete the project?')) {
			ProjectService['delete'](id).then(function() {
				$location.path("/project");
			});
		}
	};
    IssueService.getIssueStatuses().then(function(statuses) {
   		for (var id in statuses){

            switch (statuses[id].name) {
                case 'New':
                    $scope.loadIssuesByStatus('issuesNew',statuses[id].id,100);
                    break;
                case 'Next action':
                    $scope.loadIssuesByStatus('issuesQueue',statuses[id].id,100);
                    break;
                case 'Blocked on client':
                    $scope.loadIssuesByStatus('issuesBlock',statuses[id].id,100);
                    break;
                case 'Resolved':
                    $scope.loadIssuesByStatus('issuesResolved',statuses[id].id,10);
                    break;
            }

        }
   	});
	//$scope.loadIssues();
}

function ProjectIssuesController($scope, $rootScope, $window, $routeParams, $location, ProjectService, IssueService) {
	
	ProjectService.get($routeParams.id).then(function(project) {
		$rootScope.project = project;
	});
	
	$scope.loadIssues = function() {
	
		delete $scope.issues;

        var config  = {
            params : {
                project_id : $routeParams.id
            }
        }

		IssueService.find(config)
			.then(function(data) {
				$scope.issues = {
					'entries' : data.issues,
					'pagination' : {
						'offset' : data.offset,
						'total' : data.total_count,
						'limit' : data.limit
					}
				};
			});
	};
	
	$scope.deleteIssue = function(issue) {
		
		if ($window.confirm('Are you sure you wish to delete the issue?')) {
			IssueService['delete'](issue.id).then(function() {
				$scope.loadIssues();
			});
		}
	};
	
	$scope['delete'] = function(id) {
		
		if ($window.confirm('Are you sure you wish to delete the project?')) {
			ProjectService['delete'](id).then(function() {
				$location.path("/project");
			});
		}
	};
	
	$scope.loadIssues();
}

function UserIssuesController($scope, IssueService) {

    $scope.loadIssues = function() {

        delete $scope.issues;

        var config  = {
            params : {
                assigned_to_id : $scope.user.id
            }
        }

        IssueService.find(config)
            .then(function(data) {
                $scope.issues = {
                    'entries' : data.issues,
                    'pagination' : {
                        'offset' : data.offset,
                        'total' : data.total_count,
                        'limit' : data.limit
                    }
                };
            });
    };

    $scope.loadIssues();
}


function IssueFormController($scope, ProjectService, IssueService, UserService) {
	
	$scope.submitting = false;
	
	ProjectService.getAllProjects().then(function(projects) {
		$scope.projects = projects;
	});
	
	IssueService.getIssueStatuses().then(function(statuses) {
		$scope.statuses = statuses;
	});

    IssueService.getPriorities().then(function(priorities) {
       $scope.priorities = priorities;
    });
	
	ProjectService.getTrackers().then(function(trackers) {
		$scope.trackers = trackers;
	});
	
	UserService.getAllUsers().then(function(users) {
		$scope.users = users;
	});
	
	$scope.setAssignedTo = function(user) {
		$scope.issue.assigned_to = user;
	};
	
	$scope.setStatus = function(status) {
		$scope.issue.status = status;
	};
	
	$scope.setCategory = function(category) {
		$scope.issue.category = category;
	};
	
	$scope.setProject = function(project) {
		$scope.issue.project = project;
	};
	
	$scope.setVersion = function(version) {
		$scope.issue.fixed_version = version;
	};
	
	$scope.setTracker = function(tracker) {
		$scope.issue.tracker = tracker;
	};

    $scope.setPriority = function(priority) {
        $scope.issue.priority = priority;
    }
	
	$scope.$watch("issue.project", function() {
		
		if (angular.isDefined($scope.issue) && angular.isDefined($scope.issue.project)) {
			
			/* Reset category if not initial assignment */
			if (angular.isDefined($scope.categories)) {
				delete $scope.issue.category;
			}
			
			/* Reset version if not initial assignment */
			if (angular.isDefined($scope.versions)) {
				delete $scope.issue.fixed_version;
			}
			
			IssueService.getCategoriesByProject($scope.issue.project.id).then(function(categories) {
				$scope.categories = categories;
			});
			
			ProjectService.getVersions($scope.issue.project.id).then(function(versions) {
				$scope.versions = versions;
			});
		}
	});
	
	$scope.buildSubmission = function() {
		
		var submission = {};
		submission.issue = {};
		
		if (angular.isDefined($scope.issue.project) && angular.isDefined($scope.issue.project.id)) {
			submission.issue.project_id = $scope.issue.project.id;
		}
		
		if (angular.isDefined($scope.issue.tracker) && angular.isDefined($scope.issue.tracker.id)) {
			submission.issue.tracker_id = $scope.issue.tracker.id;
		}
		
		if (angular.isDefined($scope.issue.status) && angular.isDefined($scope.issue.status.id)) {
			submission.issue.status_id = $scope.issue.status.id;
		}
		
		if (angular.isDefined($scope.issue.subject)) {
			submission.issue.subject = $scope.issue.subject;
		}
		
		if (angular.isDefined($scope.issue.description)) {
			submission.issue.description = $scope.issue.description;
		}
		
		if (angular.isDefined($scope.issue.assigned_to) && angular.isDefined($scope.issue.assigned_to.id)) {
			submission.issue.assigned_to_id = $scope.issue.assigned_to.id;
		} else {
			submission.issue.assigned_to_id = null;
		}
		
		if (angular.isDefined($scope.issue.parent_issue) && angular.isDefined($scope.issue.parent_issue.id)) {
			submission.issue.parent_issue_id = $scope.issue.parent_issue.id;
		} else {
			submission.issue.parent_issue_id = null;
		}
		
		if (angular.isDefined($scope.issue.category) && angular.isDefined($scope.issue.category.id)) {
			submission.issue.category_id = $scope.issue.category.id;
		} else {
			submission.issue.category_id = null;
		}
		
		if (angular.isDefined($scope.issue.fixed_version) && angular.isDefined($scope.issue.fixed_version.id)) {
			submission.issue.fixed_version_id = $scope.issue.fixed_version.id;
		} else {
			submission.issue.fixed_version_id = null;
		}
		
		if (angular.isDefined($scope.issue.tracker) && angular.isDefined($scope.issue.tracker.id)) {
			submission.issue.tracker_id = $scope.issue.tracker.id;
		}

        if (angular.isDefined($scope.issue.priority) && angular.isDefined($scope.issue.priority.id)) {
            submission.issue.priority_id = $scope.issue.priority.id;
        }

		return submission;
	};
}


function IssueCreateController($injector, $scope, ProjectService, IssueService, UserService, $routeParams, $location, $rootScope) {
	
	$scope.issue = {};

    /* Assign default value after trackers are loaded */
    $scope.$watch("trackers", function() {
        if (angular.isDefined($scope.trackers) && $scope.trackers.length > 0) {
            $scope.issue.tracker = $scope.trackers[0];
        }
    });

    /* Assign default value after priorities are loaded */
    $scope.$watch("priorities", function() {
        if (angular.isDefined($scope.priorities) && $scope.priorities.length > 0) {
            /* Search for Normal priority */
            for (var i = 0; i < $scope.priorities.length; i++) {
                var priority = $scope.priorities[i];
                if ("Normal" == priority.name) {
                    $scope.issue.priority = priority;
                }
            }
            /* Use first available if normal not found */
            if (angular.isUndefined($scope.issue.priority)) {
                $scope.issue.priority = $scope.priorities[0];
            }
        }
    });

    /* Assign default value after issue statuses are loaded */
    $scope.$watch("statuses", function() {
        if (angular.isDefined($scope.statuses) && $scope.statuses.length > 0) {
            $scope.issue.status = $scope.statuses[0];
        }
    });

    /* Preselect project whose id was passed by url */
    if (angular.isDefined($routeParams.project_id)) {
        ProjectService.get($routeParams.project_id).then(function(project) {
            $rootScope.project = project;
            $scope.issue.project = project;
        });
    }
	
	$scope.submit = function() {
		
		$scope.submitting = true;
		delete $scope.errors;
		IssueService.create($scope.buildSubmission()).then(
				function() {
					$scope.submitting = false;
					$location.path("project/" + $scope.issue.project.id);
				},
				function(response) {
					$scope.errors = response.data.errors;
					$scope.submitting = false;
				}
			);
	};
	
	$injector.invoke(IssueFormController, this, {
		$scope: $scope,
		ProjectService: ProjectService,
		IssueService: IssueService,
		UserService: UserService
	});
}
IssueCreateController.prototype = Object.create(IssueFormController.prototype);


function IssueEditController($injector, $scope, ProjectService, IssueService, UserService, $routeParams, $location, $rootScope) {

	IssueService.get($routeParams.id).then(function(issue) {
		$scope.issue = issue;
		$rootScope.project = $scope.issue.project;
	});

	$scope.submit = function() {

		$scope.submitting = true;
		delete $scope.errors;
		IssueService.update($routeParams.id, $scope.buildSubmission()).then(
			function() {
				$scope.submitting = false;
				$location.path("project/" + $scope.issue.project.id);
			},
			function(response) {
				$scope.errors = response.data.errors;
				$scope.submitting = false;
			}
		);
	};

	$injector.invoke(IssueFormController, this, {
		$scope: $scope,
		ProjectService: ProjectService,
		IssueService: IssueService,
		UserService: UserService
	});
}
IssueEditController.prototype = Object.create(IssueFormController.prototype);


function IssueViewController($injector, $scope, ProjectService, IssueService, UserService, $routeParams, $location, $rootScope) {

    IssueService.getIssueStatuses().then(function(statuses) {
   		$scope.statuses = statuses;
   	});

	IssueService.get($routeParams.id).then(function(issue) {
		$scope.issue = issue;
        if (angular.isDefined($scope.statuses) && $scope.statuses.length > 0) {
            var statuses = [];
            for (var s in $scope.statuses){
                statuses[$scope.statuses[s].id] = $scope.statuses[s].name;
            }
            for (var journalId in $scope.issue.journals){
                if ($scope.issue.journals[journalId].details.length > 0){

                    if ($scope.issue.journals[journalId].details[0].name == 'status_id'){
                        //alert(($scope.issue.journals[journalId].details[0].old_value));
                        $scope.issue.journals[journalId].changes = statuses[$scope.issue.journals[journalId].details[0].old_value];
                        $scope.issue.journals[journalId].changes += ' => ' + statuses[$scope.issue.journals[journalId].details[0].new_value];
                    }
                } else {
                    $scope.issue.journals[journalId].changes = '';
                }
            }
        }
		$rootScope.project = $scope.issue.project;
	});

	$scope.submit = function() {

		$scope.submitting = true;
		delete $scope.errors;
		IssueService.update($routeParams.id, $scope.buildSubmission()).then(
			function() {
				$scope.submitting = false;
				$location.path("project/" + $scope.issue.project.id);
			},
			function(response) {
				$scope.errors = response.data.errors;
				$scope.submitting = false;
			}
		);
	};

	$injector.invoke(IssueFormController, this, {
		$scope: $scope,
		ProjectService: ProjectService,
		IssueService: IssueService,
		UserService: UserService
	});
}
IssueViewController.prototype = Object.create(IssueFormController.prototype);