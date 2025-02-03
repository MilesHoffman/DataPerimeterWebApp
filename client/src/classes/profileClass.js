export class Profile {
  /**
   * Create a new Profile.
   * @param {string} name - The profile name.
   * @param {Array} resources - An array of resource objects.
   * @param {object} keys - An object containing static credentials.
   *        Expected properties: accessKeyId, secretAccessKey, sessionToken.
   */
  constructor(name, resources = [], keys = {}) {
    this.name = name;
    this.resources = resources;

    // Destructure keys to provide explicit properties
    const { accessKeyId = "", secretAccessKey = "", sessionToken = "" } = keys;
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.sessionToken = sessionToken;
  }

  /**
   * Call an API to get resource info.
   * @returns {Array} An array of resource info.
   */
  getResources() {
    return [
      // Return info
    ];
  }

  /**
   * Display the keys in the console.
   */
  displayKeys() {
    console.log("Profile Keys:");
    console.log("Access Key ID:", this.accessKeyId);
    console.log("Secret Access Key:", this.secretAccessKey);
    console.log("Session Token:", this.sessionToken);
  }
}
