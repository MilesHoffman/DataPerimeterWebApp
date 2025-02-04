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
const config = { region: REGION };

// Cognito User Pool details
const poolData = {
  UserPoolId: "us-east-2_Z4LAAO6F8", // User pool ID
  ClientId: "5ku6g318514rb9u6hmn1dgvuvt", // Application client ID
};

// Cognito Identity Pool ID
const IDENTITY_POOL_ID = "us-east-2:b3a5d7ea-d40d-4e87-a126-a3a8f953c92c";

// Client initialization
const cognitoIdentityClient = new CognitoIdentityClient(config);
const cognitoIdentityProviderClient = new CognitoIdentityProviderClient(config);

/**
 * Authenticates a user with Cognito User Pools and handles challenges.
 * @param {string} username - User's username.
 * @param {string} password - User's password.
 * @returns {object} - Authentication tokens.
 */
async function authenticateUser(username, password) {
  const params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: poolData.ClientId,
    AuthParameters: { USERNAME: username, PASSWORD: password },
  };

  const command = new InitiateAuthCommand(params);

  try {
    const response = await cognitoIdentityProviderClient.send(command);

    // Handle NEW_PASSWORD_REQUIRED challenge
    if (response.ChallengeName === "NEW_PASSWORD_REQUIRED") {
      console.log("Challenge: User needs to set a new password.");
      const newPassword = "Test_1234"; // Replace with logic to get a new password

      const challengeResponses = {
        USERNAME: username,
        NEW_PASSWORD: newPassword,
      };

      const respondParams = {
        ChallengeName: "NEW_PASSWORD_REQUIRED",
        ClientId: poolData.ClientId,
        ChallengeResponses: challengeResponses,
        Session: response.Session,
      };

      const respondCommand = new RespondToAuthChallengeCommand(respondParams);
      const newPasswordResponse = await cognitoIdentityProviderClient.send(
        respondCommand
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

      const challengeResponses = { USERNAME: username, PASSWORD: password };

      const respondParams = {
        ChallengeName: "PASSWORD_VERIFIER",
        ClientId: poolData.ClientId,
        ChallengeResponses: challengeResponses,
        Session: response.Session,
      };

      const respondCommand = new RespondToAuthChallengeCommand(respondParams);
      const passwordVerifierResponse = await cognitoIdentityProviderClient.send(
        respondCommand
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
 * @param {string} refreshToken - The refresh token.
 * @returns {object} - New access and ID tokens.
 */
async function refreshSession(refreshToken) {
  const params = {
    AuthFlow: "REFRESH_TOKEN_AUTH",
    ClientId: poolData.ClientId,
    AuthParameters: { REFRESH_TOKEN: refreshToken },
  };

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

// Main function for testing the authentication and S3 access
async function main() {
  const USERNAME = "miles";
  const PASSWORD = "Test_1234";

  try {
    // Authenticate the user
    const tokens = await authenticateUser(USERNAME, PASSWORD);
    console.log("User authenticated.");

    // Get the Cognito Identity D
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

    // Get temporary AWS credentials using the Identity ID
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

    // These keys will be stored in profileClass.js and sent to the profile provider
    const credentials = {
      accessKeyId: credentialsResponse.Credentials.AccessKeyId,
      secretAccessKey: credentialsResponse.Credentials.SecretKey,
      sessionToken: credentialsResponse.Credentials.SessionToken,
    };

    console.log("AWS credentials obtained.");
console.log("Credentials:", credentials);
    // Create an S3 client with the temporary credentials and list buckets
    const s3Client = new S3Client({ region: REGION, credentials });
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

// Run the test if this file is executed directly.
if (require.main === module) {
  main();
}

module.exports = {
  authenticateUser,
  refreshSession,
  poolData,
  IDENTITY_POOL_ID,
};
