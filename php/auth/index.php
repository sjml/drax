<?php
  require_once 'vendor/autoload.php';
  require_once './secrets.php';

  session_start();

  $provider = new \League\OAuth2\Client\Provider\Github([
    'clientId'                => $secrets['githubClientId'],
    'clientSecret'            => $secrets['githubClientSecret'],
    'redirectUri'             => 'http://localhost:4201/auth/',
  ]);

  if (!isset($_GET['code'])) {
    // initial load; set up request to GitHub and redirect
    $options = [
      'scope' => ['user','repo']
    ];
    $authUrl = $provider->getAuthorizationUrl($options);
    $_SESSION['oauth2state'] = $provider->getState();
    header('Location: '.$authUrl);
    exit;
  }
  elseif (empty($_GET['state'])){
    $result = "{'status': 'ERR', 'code': 'NO_STATE'}";
  }
  elseif ($_GET['state'] !== $_SESSION['oauth2state']) {
    $result = "{'status': 'ERR', 'code': 'STATE_MISMATCH'}";
  }
  else {
    // Try to get an access token (using the authorization code grant)
    $token = $provider->getAccessToken('authorization_code', [
      'code' => $_GET['code']
    ]);

    $result = "{'status': 'OK', 'code': '".$token->getToken()."'}";
  }

  // send it back
  unset($_SESSION['oauth2state']);

  // print doc with JS to return result to opener and close window
  echo('<html><head><script>window.opener.postMessage('.$result.', "*");window.close();</script></head><body></body></html>');
?>
