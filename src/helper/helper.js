const { ethers } = require("ethers");

const Layer2ABI = require("../abi/Layer2.json");
const AutoRefactorCoinageABI = require("../abi/AutoRefactorCoinage.json");
const SeigManagerABI = require("../abi/SeigManager.json");
const DepositManagerABI = require("../abi/DepositManager.json");
const TONABI = require("../abi/TON.json");

const infuraId = "27113ffbad864e8ba47c7d993a738a10";

exports.Layer2 = function (address, signerOrProvider) {
  if (!signerOrProvider) {
    signerOrProvider = new ethers.providers.InfuraProvider(
      "rinkeby",
      infuraId,
    )
  }
  return new ethers.Contract(address, Layer2ABI, signerOrProvider);
}

exports.Coinage = function (address, signerOrProvider) {
  if (!signerOrProvider) {
    signerOrProvider = new ethers.providers.InfuraProvider(
      "rinkeby",
      infuraId,
    )
  }
  return new ethers.Contract(address, AutoRefactorCoinageABI, signerOrProvider);
}

exports.SeigManager = function (address, signerOrProvider) {
  if (!address) {
    address = "0x957DaC3D3C4B82088A4939BE9A8063e20cB2efBE";
  }

  if (!signerOrProvider) {
    signerOrProvider = new ethers.providers.InfuraProvider(
      "rinkeby",
      infuraId,
    )
  }
  return new ethers.Contract(address, SeigManagerABI, signerOrProvider);
}

exports.DepositManager = function (address, signerOrProvider) {
  if (!address) {
    address = "0x57F5CD759A5652A697D539F1D9333ba38C615FC2";
  }

  if (!signerOrProvider) {
    signerOrProvider = new ethers.providers.InfuraProvider(
      "rinkeby",
      infuraId,
    )
  }
  return new ethers.Contract(address, DepositManagerABI, signerOrProvider);
}

exports.TON = function (address, signerOrProvider) {
  if (!address) {
    address = "0x44d4F5d89E9296337b8c48a332B3b2fb2C190CD0";
  }

  if (!signerOrProvider) {
    signerOrProvider = new ethers.providers.InfuraProvider(
      "rinkeby",
      infuraId,
    )
  }
  return new ethers.Contract(address, TONABI, signerOrProvider);
}

exports.getBlock = async function (blockNumber) {
  const provider = new ethers.providers.InfuraProvider(
    "rinkeby",
    infuraId,
  )
  return await provider.getBlock(blockNumber);
}

exports.getBlockNumber = async function () {
  const provider = new ethers.providers.InfuraProvider(
    "rinkeby",
    infuraId,
  )
  return await provider.getBlockNumber();
}
