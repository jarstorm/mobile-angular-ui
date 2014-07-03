var myApp = angular.module('myApp', ["mobile-angular-ui", "ngRoute"]);
var serviceApiKey = 'apiKey=EiwPrTxk16OEezJ1SqMBtdzdIJSftYCN';
var servicePath = 'https://api.mongolab.com/api/1/databases/adprueba/';
var userId = "539594c4e4b065c907b26526";

// configure our routes
	myApp.config(function($routeProvider) {
		$routeProvider
			.when('/', {
				templateUrl : 'pages/home.html',
				controller  : 'mainController'
			})
			.when('/shop/:shopId', {
				templateUrl : 'pages/shop.html',
				controller  : 'shopController'
			})
			.when('/addshop/', {
				templateUrl : 'pages/addshop.html',
				controller  : 'addShopController'
			})
			.when('/follow', {
				templateUrl : 'pages/follow.html',
				controller  : 'followController'
			})
			.when('/config', {
				templateUrl : 'pages/config.html',
				controller  : 'configController'
			});
	});
	

var seconds = 10;
	

// Set up the cache temporalCache
myApp.factory('temporalCache', function($cacheFactory) {
 var cache =  $cacheFactory('myData');
 
 var originalCacheGet = cache.get;
 var originalCachePut = cache.put;
 
 cache.get = function(key) {	
	var cacheData =  originalCacheGet(key);
	if (cacheData && new Date().getTime() - cacheData.time < seconds * 1000) {
		return cacheData.value;
	}
	return null;
 }
 
 cache.put = function(key, value) {	
	var cacheData = {time: new Date().getTime(), value: value}
	return originalCachePut(key, cacheData);
 }
 
 return cache;
});

	
	myApp.controller('mainController', function($scope, $http, temporalCache) {		
		
		var someKey = "bus";			

		$scope.items = temporalCache.get(someKey);
		
		if (!$scope.items) {
		   $http.get(servicePath+'collections/user/'+userId+"?"+serviceApiKey).success(function(data) {            
				//$scope.items = data;	
				//temporalCache.put(someKey, $scope.items);					
				
								var arrayString = [];
	for (var i = 0; i < data.messages.length; i++) {
		arrayString.push({ $oid:  data.messages[i].id});
	}
				getChainedElements($http, "message", arrayString, function(data) {$scope.items = data;});
			});		
		}   		
	});
	
	myApp.controller('configController', function($scope, $http, temporalCache, $location) {		
		$http.get(servicePath+'collections/user/'+userId+"?"+serviceApiKey).success(function(data) {            
				$scope.user = data;									
			});		
		$scope.save = function() {
			var phone = $scope.user.phone;
			var birth = $scope.user.birth;
			var city = $scope.user.city;
			var state = $scope.user.state;
			var city_notification = $scope.user.city_notification;
			var state_notification = $scope.user.state_notification;
			console.log("lala");
			var url= servicePath+'collections/user/'+userId+"?"+serviceApiKey;	
			var data = JSON.stringify( { "$set" : { "city" : city, "phone":phone, "birth":birth, "state":state, "city_notification":city_notification, "state_notification": state_notification } } );
			$http.put(url,data).success(function(data) {            
				$scope.user = data;	
				$location.path( "/" );				
			}).error(function(data, status, headers, config) {
				console.log(data);
				console.log(status);
				console.log(headers);
				console.log(config);
			});
			
		}
		 		
	});
	
	myApp.controller('addShopController', function($scope, $http, temporalCache, $sce) {				
		$scope.search = function() {
			var name = $scope.name;
			var query = "?q={'name': {'$regex': '"+ name+"', $options: 'i'}}";
			$http.get(servicePath+'collections/shop/'+query+"&"+serviceApiKey).success(function(data) {            
				$scope.items = data;									
			});		
		}
		
		$scope.highlight = function(text, search) {
    if (!search) {
        return $sce.trustAsHtml(text);
    }
    return $sce.trustAsHtml(text.replace(new RegExp(search, 'gi'), '<span class="highlightedText">$&</span>'));
};

	});
	
	myApp.controller('followController', function($scope, $http, temporalCache) {		
		
		$http.get(servicePath+'collections/user/'+userId+"?"+serviceApiKey).success(function(data) {            									
					var arrayString = [];
	for (var i = 0; i < data.follow.length; i++) {
		arrayString.push({ $oid:  data.follow[i]});
	}
			getChainedElements($http, "shop", arrayString, function(data) {
			$scope.items = data;});
		});		
		 	
		$scope.hello = function() {
			console.log("hello");
		}
	});
	
	myApp.controller('shopController', function($scope, $http, $routeParams, $location, $route) {			
		$http.get(servicePath+'collections/shop/'+$routeParams.shopId+"?"+serviceApiKey).
			success(function(data) {            
				$scope.shop = data;			
				if (data.coments.length > 0) {
				var arrayString = [];
	for (var i = 0; i < data.coments.length; i++) {
		arrayString.push({ $oid:  data.coments[i]});
	}
	
					getChainedElements($http, "message", arrayString, function(data) {$scope.shop.coments = data;});
				}
				$http.get(servicePath+'collections/user/'+userId+"?"+serviceApiKey).success(function(data) {            				
					$scope.following = data.follow.indexOf($scope.shop._id.$oid) !== -1;		
				});	
			});					
					
		$scope.follow = function() {			
			$http.get(servicePath+'collections/user/'+userId+"?"+serviceApiKey).success(function(data) {            																		
				var url= servicePath+'collections/user/'+userId+"?"+serviceApiKey;	
				data.follow.push($scope.shop._id.$oid);
				var newFollow = data.follow;
				var data = JSON.stringify( { "$set" : { "follow": newFollow } } );
				$http.put(url,data).success(function(data) {            
					$scope.user = data;	
					$route.reload();
				}).error(function(data, status, headers, config) {
					console.log(data);
					console.log(status);
					console.log(headers);
					console.log(config);
				});
				console.log($scope.shop._id.$oid);
			});		
		};
		
		$scope.unfollow = function() {
			$http.get(servicePath+'collections/user/'+userId+"?"+serviceApiKey).success(function(data) {            																		
				var url= servicePath+'collections/user/'+userId+"?"+serviceApiKey;	
				data.follow.pop($scope.shop._id.$oid);
				var newFollow = data.follow;
				var data = JSON.stringify( { "$set" : { "follow": newFollow } } );
				$http.put(url,data).success(function(data) {            
					$scope.user = data;	
					$route.reload();
				}).error(function(data, status, headers, config) {
					console.log(data);
					console.log(status);
					console.log(headers);
					console.log(config);
				});				
			});		
		};
	});
	

function getChainedElements($http, collection, array, callback) {	
	
	var query = "?q="+JSON.stringify( { _id: { $in : array } } );	
	$http.get(servicePath+'collections/'+collection+'/'+query+"&"+serviceApiKey).success(function(data) {            
		callback(data);
	});
	
}	