/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! HEAD TO PROFILELOGIC.JS FOR FURTHER INFO !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */

export class Profile {
  /**
   * Create a new Profile.
   * @param {string} name - The profile name (e.g. the user’s name or identifier).
   * @param {Array} resources - An array of resource objects.
   * @param {object} keys - An object containing static credentials:
   *                        { userPoolId, clientId, identityPoolId }.
   */
  constructor(name, resources = [], keys = {}) {
    this.name = name;
    this.resources = resources;
    this.keys = keys; // Store the three static keys here.
  }

  // API to get resources will be called here
  getResources() {
    // Call API or intermediary
    return [
      // Return info
    ];
  }
}

/* Make a new instance of the profile class and store that instance in the profile */
