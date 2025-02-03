// server/apis/cognito_api.js
const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const {
  CognitoIdentityClient,
  GetCredentialsForIdentityCommand,
  GetIdCommand,
} = require("@aws-sdk/client-cognito-identity");

const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");

// Configuration
const REGION = "us-east-2"; // Ohio
const config = {
  region: REGION,
};

// Cognito User Pool details
const poolData = {
  UserPoolId: "us-east-2_Z4LAAO6F8", //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  /* Can see these in the AWS cognito API, is a pool of users */
  ClientId: "5ku6g318514rb9u6hmn1dgvuvt", //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  /* An ID that tells AWS what application you're trying to use */
};

// Cognito Identity Pool ID
const IDENTITY_POOL_ID = "us-east-2:b3a5d7ea-d40d-4e87-a126-a3a8f953c92c"; //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
/* Way to connect a user to an IM rule, right now is an admin */

// Client Initialization

// Client for interacting with Cognito Identity (federated identities)
const cognitoIdentityClient = new CognitoIdentityClient(config);

// Client for interacting with Cognito User Pools
const cognitoIdentityProviderClient = new CognitoIdentityProviderClient(config);

// Authentication Function

/**
 * Authenticates a user with Cognito User Pools and handles challenges.
 *
 * @param {string} username - User's username.
 * @param {string} password - User's password.
 * @returns {object} - Authentication tokens (accessToken, idToken, refreshToken).
 */
async function authenticateUser(username, password) {
  // Authentication parameters
  const params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: poolData.ClientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  };

  // Initiate authentication
  const command = new InitiateAuthCommand(params);

  try {
    const response = await cognitoIdentityProviderClient.send(command);

    // Handle challenges. Basically handle 'Set a new password'
    if (response.ChallengeName === "NEW_PASSWORD_REQUIRED") {
      console.log("Challenge: User needs to set a new password.");
      const newPassword = "Test_1234"; // Get new password

      const challengeResponses = {
        USERNAME: username,
        NEW_PASSWORD: newPassword,
      };

      const respondToAuthChallengeParams = {
        ChallengeName: "NEW_PASSWORD_REQUIRED",
        ClientId: poolData.ClientId,
        ChallengeResponses: challengeResponses,
        Session: response.Session,
      };

      const respondToAuthChallengeCommand = new RespondToAuthChallengeCommand(
        respondToAuthChallengeParams
      );
      const newPasswordResponse = await cognitoIdentityProviderClient.send(
        respondToAuthChallengeCommand
      );

      console.log("New password set successfully.");
      return {
        accessToken: newPasswordResponse.AuthenticationResult.AccessToken,
        idToken: newPasswordResponse.AuthenticationResult.IdToken,
        refreshToken: newPasswordResponse.AuthenticationResult.RefreshToken,
      };
    } else if (response.ChallengeName === "SMS_MFA") {
      console.error("Error: SMS MFA handling not implemented.");
      throw new Error("SMS MFA flow not implemented");
    } else if (response.ChallengeName === "PASSWORD_VERIFIER") {
      console.log("Challenge: Password verification required.");

      const challengeResponses = {
        USERNAME: username,
        PASSWORD: password,
      };

      const respondToAuthChallengeParams = {
        ChallengeName: "PASSWORD_VERIFIER",
        ClientId: poolData.ClientId,
        ChallengeResponses: challengeResponses,
        Session: response.Session,
      };

      const respondToAuthChallengeCommand = new RespondToAuthChallengeCommand(
        respondToAuthChallengeParams
      );
      const passwordVerifierResponse = await cognitoIdentityProviderClient.send(
        respondToAuthChallengeCommand
      );

      console.log("Password verified successfully.");
      return {
        accessToken: passwordVerifierResponse.AuthenticationResult.AccessToken,
        idToken: passwordVerifierResponse.AuthenticationResult.IdToken,
        refreshToken:
          passwordVerifierResponse.AuthenticationResult.RefreshToken,
      };
    }

    console.log("Authentication successful.");
    return {
      accessToken: response.AuthenticationResult.AccessToken,
      idToken: response.AuthenticationResult.IdToken,
      refreshToken: response.AuthenticationResult.RefreshToken,
    };
  } catch (error) {
    console.error("Error authenticating user:", error);
    throw error;
  }
}

/**
 * Refreshes the user's session using a refresh token.
 *
 * @param {string} refreshToken - The refresh token.
 * @returns {object} - New access and ID tokens.
 */
async function refreshSession(refreshToken) {
  // Parameters for refreshing the session
  const params = {
    AuthFlow: "REFRESH_TOKEN_AUTH",
    ClientId: poolData.ClientId,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
    },
  };

  // Command to initiate the refresh.
  const command = new InitiateAuthCommand(params);

  try {
    const response = await cognitoIdentityProviderClient.send(command);
    console.log("Session refreshed successfully.");
    return {
      accessToken: response.AuthenticationResult.AccessToken,
      idToken: response.AuthenticationResult.IdToken,
    };
  } catch (error) {
    console.error("Error refreshing session:", error);
    throw error;
  }
}

// Main function for testing

async function main() {
  /* General credentials for individuals, only a total of 3 sets for userID, ClientID, & IdentityPoolID */
  const USERNAME = "miles"; //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  const PASSWORD = "Test_1234"; //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  try {
    // Authenticate the user
    const tokens = await authenticateUser(USERNAME, PASSWORD);
    console.log("User authenticated.");

    // Get the user's Cognito Identity ID
    const getIdParams = {
      IdentityPoolId: IDENTITY_POOL_ID,
      Logins: {
        [`cognito-idp.${REGION}.amazonaws.com/${poolData.UserPoolId}`]:
          tokens.idToken,
      },
    };
    const getIdCommand = new GetIdCommand(getIdParams);
    const getIdResponse = await cognitoIdentityClient.send(getIdCommand);

    console.log("Cognito Identity ID:", getIdResponse.IdentityId);

    // Get temporary AWS credentials using the Cognito Identity ID
    const getCredentialsParams = {
      IdentityId: getIdResponse.IdentityId,
      Logins: {
        [`cognito-idp.${REGION}.amazonaws.com/${poolData.UserPoolId}`]:
          tokens.idToken,
      },
    };
    const getCredentialsCommand = new GetCredentialsForIdentityCommand(
      getCredentialsParams
    );
    const credentialsResponse = await cognitoIdentityClient.send(
      getCredentialsCommand
    );
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    /* When you sign in these 3 keys will be returned and you'll want to store them in the profileClass.js, afterwhich you'll send them to the profile provider*/
    // Extract the credentials
    const credentials = {
      accessKeyId: credentialsResponse.Credentials.AccessKeyId,
      secretAccessKey: credentialsResponse.Credentials.SecretKey,
      sessionToken: credentialsResponse.Credentials.SessionToken,
    };

    console.log("AWS credentials obtained.");

    // Create an S3 client with the temporary credentials
    const s3Client = new S3Client({ region: REGION, credentials: credentials });

    // List S3 buckets
    const listBucketsCommand = new ListBucketsCommand({});
    try {
      const data = await s3Client.send(listBucketsCommand);
      console.log(
        "S3 Buckets:",
        data.Buckets.map((bucket) => bucket.Name)
      );
    } catch (err) {
      console.error("Error listing S3 buckets:", err);
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Run the file to test out the script.
if (require.main === module) {
  main();
}

module.exports = {
  authenticateUser,
  refreshSession,
  poolData,
  IDENTITY_POOL_ID,
};
