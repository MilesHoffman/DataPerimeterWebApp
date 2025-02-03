export class Profile {
  /**
   * Create a new Profile.
   * @param {string} name - The profile name.
   * @param {Array} resources - An array of resource objects.
   * @param {object} keys - An object containing static credentials.
   */
  constructor(name, resources = [], keys = {}) {
    this.name = name;
    this.resources = resources;
    this.keys = keys;
  }

  getResources() {
    // This method will call an API to get resource info.
    return [
      // Return info
    ];
  }
}
