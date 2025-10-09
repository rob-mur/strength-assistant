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
        platformVersions = ["35"];
        abiVersions = ["x86_64"];
        includeEmulator = true;
        emulatorVersion = "35.5.10";
        includeSystemImages = true;
        systemImageTypes = ["default"];
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

