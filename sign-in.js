const request = require("request");

var site_url = "";
var db_rule = "";
var login = "";
var password = "";

function getToken() {
  return new Promise(function(done) {
    console.log("Getting token");
    var serverURL = site_url + "/users/sign_in";

    var headers = {
      "user-agent":
        "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36"
    };

    var options = {
      url: serverURL,
      gzip: true,
      headers: headers,
      method: "GET"
    };

    request(options, function(err, res, body) {
      if (err) {
        console.log(err);

        return done(false);
      } else {
        var token_raw = body.match(
          /<meta content="(.*?)" name="csrf-token" \/>/
        );

        var tab_id_raw = body.match(/<meta content="(.*?)" name="tab-id" \/>/);

        if (
          token_raw.length == 0 ||
          token_raw[1] == undefined ||
          tab_id_raw.length == 0 ||
          tab_id_raw[1] == undefined
        ) {
          console.log("Something wrong with getting token");

          return done(false);
        } else {
          var token = token_raw[1];
          var tab_id = tab_id_raw[1];
          var cookies = res.headers["set-cookie"][0];

          return done({
            Token: token,
            TabID: tab_id,
            Cookies: cookies
          });
        }
      }
    });
  });
}

function signIn(tab_id, token, cookies) {
  return new Promise(function(done) {
    console.log("Signing in");

    var serverURL = site_url + "/users/sign_in";

    var host = serverURL.split("/")[2];

    var headers = {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate",
      "Accept-Language": "en-GB,en;q=0.9,en-US;q=0.8,ru;q=0.7,uk;q=0.6",
      "Cache-Control": "max-age=0",
      Connection: "keep-alive",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookies,
      Host: host,
      Origin: site_url,
      Referer: serverURL,
      "Upgrade-Insecure-Requests": "1",
      "user-agent":
        "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36"
    };

    var form = {
      _tab_id: tab_id,
      utf8: "&#x2713;",
      authenticity_token: token,
      "user[Login]": login,
      "user[password]": password,
      commit: "Login"
    };

    var options = {
      url: serverURL,
      headers: headers,
      form: form,
      method: "POST"
    };

    request(options, function(err, res, body) {
      if (err) {
        console.log(err);

        return done(false);
      } else {
        console.log("Status: " + res.statusCode);

        var cookies = res.headers["set-cookie"][0];

        return done(cookies);
      }
    });
  });
}

function getCode(cookies) {
  return new Promise(function(done) {
    console.log("Getting code");

    var host = site_url.split("/")[2];

    var headers = {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate",
      "Accept-Language": "en-GB,en;q=0.9,en-US;q=0.8,ru;q=0.7,uk;q=0.6",
      "Cache-Control": "max-age=0",
      Connection: "keep-alive",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookies,
      Host: host,
      Referer: db_rule,
      "Upgrade-Insecure-Requests": "1",
      "user-agent":
        "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36"
    };

    var options = {
      url: db_rule,
      headers: headers,
      method: "GET"
    };

    request(options, function(err, res, body) {
      console.log("Status: " + res.statusCode);

      if (err) {
        console.log(err);

        return done(false);
      } else {
        var code_raw = body.match(
          /<div id='execution_code_editor' style='height: 300px;'>(.*?)<\/div>/
        );

        var tab_id_raw = body.match(/<meta content="(.*?)" name="tab-id" \/>/);

        if (
          code_raw == null ||
          code_raw.length == 0 ||
          code_raw[1] == undefined
        ) {
          console.log("Something wrong with getting code 2");

          return done(false);
        } else {
          return done(code_raw[1]);
        }
      }
    });
  });
}

async function start() {
  /*
    1 step. get unique values from sign in page: tab_id, token and cookies

    getToken() returns object

    {
      Token: String,
      TabID: String,
      Cookies: String
    }
  */
  var credentials = await getToken();

  /*
    2 step. Using data from getToken() do sign in on streamline and get cookies

    signIn() returns String
  */
  var cookies = await signIn(
    credentials.TabID,
    credentials.Token,
    credentials.Cookies
  );

  /*
    3 step. Get code from db rule

    getCode() returns code from db rule
  */
  var code = await getCode(cookies);

  console.log(code);
}

start();
