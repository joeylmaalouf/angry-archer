var app = angular.module('angryarcher', ['ngRoute']);

app.config(function($routeProvider, $locationProvider){

  $routeProvider

  .when("/",
  {
      templateUrl : '../views/game.html',
      controller: "mainController"
  })

  $locationProvider.html5Mode(true);
});

app.controller('mainController', function($scope, $http, $location){
  $scope.loggedIn = false;
});

