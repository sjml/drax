<?php
  require_once 'vendor/autoload.php';
  require_once './secrets.php';

  session_start();

  // not perfect, but should work for our needs
  function full_path()
  {
      $s = &$_SERVER;
      $ssl = (!empty($s['HTTPS']) && $s['HTTPS'] == 'on') ? true:false;
      $sp = strtolower($s['SERVER_PROTOCOL']);
      $protocol = substr($sp, 0, strpos($sp, '/')) . (($ssl) ? 's' : '');
      $port = $s['SERVER_PORT'];
      $port = ((!$ssl && $port=='80') || ($ssl && $port=='443')) ? '' : ':'.$port;
      $host = isset($s['HTTP_X_FORWARDED_HOST']) ? $s['HTTP_X_FORWARDED_HOST'] : (isset($s['HTTP_HOST']) ? $s['HTTP_HOST'] : null);
      $host = isset($host) ? $host : $s['SERVER_NAME'] . $port;
      $uri = $protocol . '://' . $host . $s['REQUEST_URI'];
      $segments = explode('?', $uri, 2);
      $url = $segments[0];
      return $url;
  }

  $provider = new \League\OAuth2\Client\Provider\Github([
    'clientId'                => $secrets['githubClientId'],
    'clientSecret'            => $secrets['githubClientSecret'],
    'redirectUri'             => full_path()
  ]);

  if (!isset($_GET['code'])) {
    // initial load; set up request to GitHub and redirect
    $options = [
      'scope' => ['read:user','repo']
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
  unset($_SESSION['oauth2state']);

  // print doc with JS to return result to opener and close window
  echo('<html><head><script>window.opener.postMessage('.$result.', "*");window.close();</script></head><body></body></html>');
?>
