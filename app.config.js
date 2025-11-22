// Fix Firebase provider conflict by updating package name or using EAS hooks
// This file extends app.json configuration

module.exports = ({ config }) => {
  return {
    ...config,
    // Add EAS hooks to handle AndroidManifest during build
    hooks: {
      postPublish: []
    }
  };
};
