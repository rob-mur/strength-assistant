{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = inputs:
    inputs.flake-utils.lib.eachDefaultSystem (system: let
      pkgs = import inputs.nixpkgs {
        inherit system;
        config = {
          allowUnfree = true;
          android_sdk.accept_license = true;
        };
      };

      androidComposition = pkgs.androidenv.composeAndroidPackages {
        buildToolsVersions = ["35.0.0"];
        platformVersions = ["35"];
        abiVersions = ["x86_64"];
        includeEmulator = true;
        emulatorVersion = "35.5.10";
        includeSystemImages = true;
        systemImageTypes = ["default"];  # Use minimal system images (~1GB savings)
        includeNDK = true;                # NDK required for app build
        ndkVersion = "27.1.12297006";     # Specify exact NDK version to avoid read-only store issues
        includeCmake = false;             # Remove CMake (~500MB savings)
      };
      androidSdk = androidComposition.androidsdk;
    in {
      packages.default = pkgs.buildEnv {
        name = "android-sdk";
        paths = [
          androidSdk
          pkgs.aapt
        ];
      };
    });
}
