<?php
class User {
  private $users;

  function __construct () {
    $this->users = [
      'admin' => [
        'id' => 1,
        'name' => 'admin',
        'password' => 'admin_!2#',
        'role' => 'administractor'
      ],
      'player' => [
        'id' => 2,
        'name' => 'player 01',
        'password' => 'player_123',
        'role' => 'normal'
      ],
      'demouser' => [
        'id' => 3,
        'name' => 'Guest',
        'password' => 'demouser',
        'role' => 'guest'
      ]
    ];
  }

  function userLogin ($loginName, $password) {
    if (!isset($this->users[$loginName])) return [];
    
    $user = $this->users[$loginName];
    return ($user['password'] === $password) ? $user : [];
  }

  function getUserByName($name) {
    return isset($this->users[$name]) ? $this->users[$name] : [];
  }
}