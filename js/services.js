var services = angular.module('trackerApp.services', ['ngResource']);

services.service('ConfigurationService', function($http) {

	var _restServiceBase = undefined;
	var _apiKey = undefined;
	
	this.getRestServiceBase = function() {
		return _restServiceBase;
	};
	
	this.setRestServiceBase = function(url) {
		_restServiceBase = url;
	};
	
	this.getApiKey = function() {
		return _apiKey;
	};
	
	this.setApiKey = function(apiKey) {
		_apiKey = apiKey;
		$http.defaults.headers.common['X-Redmine-API-Key'] = apiKey;
	};
});


services.service('GroupsService', function($http, $q, ConfigurationService) {

	var allGroupsPromise = undefined;
    var allGroups = undefined;
    var mapGroups = undefined;
    var groupData = {};
    var groupService = this;

	this.getAllGroups = function(onlyTeams) {

		if (angular.isDefined(allGroupsPromise)) {
			return allGroupsPromise;
		}

        allGroupsPromise = $http.get(ConfigurationService.getRestServiceBase() + "/groups.json").then(function(response) {
            mapGroups = {};
            allGroups = response.data.groups;

            /* First pass, hash projects */
            for (var i = 0; i < response.data.groups.length; i++) {
                if (onlyTeams === true && response.data.groups[i].name.indexOf('OpsWay') === -1) continue;
                mapGroups[response.data.groups[i].id] = response.data.groups[i];
            }
            return mapGroups;//.sort(function(a,b){ return a.id - b.id;});
		});

		return allGroupsPromise;
	};

    this.get = function(id) {
        if (angular.isDefined(groupData[id])) {
      			return groupData[id];
      		}
        groupData[id] = $http.get(ConfigurationService.getRestServiceBase() + "/groups/" + id + ".json?include=users,memberships").then(function(response){
             return response.data.group;
        });

        return groupData[id];

   	};

    this.addTeamFilterToParams = function(teamId){
        var configParams = '';
        return groupService.get(teamId).then(function(group){
            console.log(group);
            //alert(JSON.stringify(group));
            if (group.memberships.length > 0){
                for (var i = 0; i < group.memberships.length; i++) {
                    configParams += 'v[project_id][]=' + group.memberships[i].project.id + '&';
                }
                configParams += 'set_filter=' + 1 + '&';
                configParams += 'f[]=project_id&';
                configParams += 'op[project_id]=%3D';
            }
            return configParams;
        });

    };

});

services.service('UserService', function($http, $q, ConfigurationService) {
	
	var allUsersPromise = undefined;
	
	this.getCurrent = function() {
		return $http.get(ConfigurationService.getRestServiceBase() + "/users/current.json");
	};
	
	this.getAllUsers = function() {
		
		if (angular.isDefined(allUsersPromise)) {
			return allUsersPromise;
		}
		
		allUsersPromise = $http.get(ConfigurationService.getRestServiceBase() + "/users.json?limit=1000").then(function(response) {
			return response.data.users;
		});
		
		return allUsersPromise;
	};
});


services.service('ProjectService', function($http, $q, ConfigurationService) {
	
	var projectService = this;
	
	var projectMap = undefined;
	var topLevelProjects = undefined;
	var allProjects = undefined;
	var loadPromise = undefined;
	
	var trackersPromise = undefined;
	
	this.loadProjects = function() {
		
		if (loadPromise !== undefined) {
			return loadPromise;
		}
		
		var deferredLoad = $q.defer();
		
		if (topLevelProjects !== undefined) {
			
			deferredLoad.resolve(topLevelProjects);
			
		} else {
			
			$http.get(ConfigurationService.getRestServiceBase() + "/projects.json?limit=1000").then(function(response) {
				
				projectMap = {};
				topLevelProjects = new Array();
				allProjects = response.data.projects;
				
				/* First pass, hash projects */
				for (var i = 0; i < response.data.projects.length; i++) {
					projectMap[response.data.projects[i].id] = response.data.projects[i];
				}
				
				/* Second pass, assign subprojects */
				for (var i = 0; i < response.data.projects.length; i++) {
					var project = response.data.projects[i];
					if (project.parent !== undefined) {
						var parent = projectMap[project.parent.id];
						if (parent.children === undefined) {
							parent.children = new Array();
						}
						parent.children.push(project);
					} else {
						topLevelProjects.push(project);
					}
				}
				
				deferredLoad.resolve(topLevelProjects);
			});
		}
		
		loadPromise = deferredLoad.promise;
		
		return loadPromise;
	};
	
	this.getTopLevelProjects = function() {
		
		return projectService.loadProjects().then(function(projects) {
			return topLevelProjects;
		});
	};
	
	this.get = function(id) {
		return projectService.loadProjects().then(function(projects) {
			return projectMap[id];
		});
	};
	
	this.getVersions = function(id) {
		return $http.get(ConfigurationService.getRestServiceBase() + "/projects/" + id + "/versions.json").then(function(response) {
			return response.data.versions;
		});
	};
	
	this.getTrackers = function() {
		
		if (angular.isDefined(trackersPromise)) {
			return trackersPromise;
		}
		
		trackersPromise = $http.get(ConfigurationService.getRestServiceBase() + "/trackers.json").then(function(response) {
			return response.data.trackers;
		});
		
		return trackersPromise;
	};
	
	//TODO: reload projects after delete
	this['delete'] = function(id) {
		return $http['delete'](ConfigurationService.getRestServiceBase() + "/projects/" + id + ".json");
	};
	
	this.getAllProjects = function() {
		
		return projectService.loadProjects().then(function(projects) {
			return allProjects;
		});
	};
});


services.service('IssueService', function($http, $q, ConfigurationService) {

    var issuesUrl = ConfigurationService.getRestServiceBase() + "/issues";
	var issueStatuses = undefined;
	
	this.find = function(config,filterParams) {
        if (filterParams == undefined) filterParams = '';
		return $http.get(issuesUrl + ".json" + filterParams, config).then(function(response) {
			return response.data;
		});
	};
	
	this.getIssueStatuses = function() {
		var deferred = $q.defer();
		
		if (issueStatuses !== undefined) {
			
			deferred.resolve(issueStatuses);
			
		} else {

			$http.get(ConfigurationService.getRestServiceBase() + "/issue_statuses.json").then(function(response) {
				issueStatuses = response.data.issue_statuses;
				deferred.resolve(issueStatuses);
			});
		}

		return deferred.promise;
	};

    this.getPriorities = function() {

      // TODO: Newer versions of redmine have a method to get the priority enumeration. If we are able to detect the
      // version we should use that method and use the hardcoded priorities as fallback.

        var deferred = $q.defer();
        deferred.resolve([
            { "id":3, "name":"Low" },
            { "id":4, "name":"Normal" },
            { "id":5, "name":"High" },
            { "id":6, "name":"Urgent" },
            { "id":7, "name":"Immediate" }
        ]);

        return deferred.promise;
    };
	
	this.getCategoriesByProject = function(projectId) {
		return $http.get(ConfigurationService.getRestServiceBase() + '/projects/' + projectId + '/issue_categories.json').then(function(response) {
			return response.data.issue_categories;
		});
	};

    this.get = function (id) {
        return $http.get(issuesUrl + "/" + id + ".json?include=journals").then(function (response) {
            return response.data.issue;
        });
    };
	
	
	this['delete'] = function(id, submission) {
		return $http['delete'](issuesUrl + "/" + id + ".json", submission).then(function(response) {
		});
	};

	this.update = function(id, submission) {
		return $http.put(issuesUrl + "/" + id + ".json", submission).then(function(response) {
			return response;
		});
	};
	
	this.create = function(submission) {
		return $http.post(issuesUrl + ".json", submission).then(function(response) {
			return response.data.issue;
		});
	};
});