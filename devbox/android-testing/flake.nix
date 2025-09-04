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
        abiVersions = ["arm64-v8a"];
        includeEmulator = true;
        emulatorVersion = "35.5.10";
        includeSystemImages = true;
        systemImageTypes = ["default"];
        includeNDK = false;
        includeCmake = false;
      };
      androidSdk = androidComposition.androidsdk;
    in {
      packages.default = pkgs.buildEnv {
        name = "android-sdk-testing";
        paths = [
          androidSdk
          pkgs.aapt
        ];
      };
    });
}