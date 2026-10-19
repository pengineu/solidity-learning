import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types/";
import { DECIMALS, MINTING_AMOUNT } from "./constants";

describe("My Token", () => {
    let myTokenC: MyToken;
    let signers: HardhatEthersSigner[];
    beforeEach("should deploy", async () => {
        signers = await hre.ethers.getSigners();
        myTokenC = await hre.ethers.deployContract("MyToken", [
            "MyToken", 
            "Mt", 
            DECIMALS,
            MINTING_AMOUNT,
        ]);
    });
    describe("Basic state value check", () => {
        it("should return name", async () => {
            expect(await myTokenC.name()).equal("MyToken");
            
        });
        it("should return symbol", async () => {
            expect(await myTokenC.symbol()).equal("Mt");
            
        });
        it("should return decimals", async () => {
            expect(await myTokenC.decimals()).equal(DECIMALS);
            
        });
     
        it("should return 100 totalSupply", async () => {
            expect(await myTokenC.totalSupply()).equal(MINTING_AMOUNT*10n**DECIMALS);
        });
    });
    describe("Mint", () => {
        it("should return 1MT balance for signer 0", async () => {
            expect(await myTokenC.balanceOf(signers[0].address)).equal(MINTING_AMOUNT*10n**DECIMALS);
        });
    })
    describe("Transfer", () => {
        it("should have 0.5MT", async () => {
            
            const signer0 = signers[0];
            const signer1 = signers[1];
            await expect(myTokenC.transfer(
                hre.ethers.parseUnits("0.5", DECIMALS),
                signer1.address
            )).to.emit(myTokenC, "Transfer").withArgs(
                signer0.address, 
                signer1.address, 
                hre.ethers.parseUnits("0.5", DECIMALS)
            );
    
            expect(await myTokenC.balanceOf(signer1)).equal(hre.ethers.parseUnits("0.5", DECIMALS));
            
        });
            it("should be reverted with insufficient balance error", async () => {
            const signer1 = signers[1];
            await expect(myTokenC.transfer(hre.ethers.parseUnits((MINTING_AMOUNT + 1n).toString(), DECIMALS), signer1.address)
            ).to.be.revertedWith("insufficient balance");
            // expect(await myTokenC.balanceOf(signer1)).equal(hre.ethers.parseUnits("0.5", 18));
        });
    })
    describe("TransferFrom", () => {
        it("should emit Approval event", async () => {
            const signer1 = signers[1];
            await expect(myTokenC.approve(signer1.address, hre.ethers.parseUnits("10", DECIMALS)))
            .to.emit(myTokenC, "Approval").withArgs(
                signer1.address,
                hre.ethers.parseUnits("10", DECIMALS)
            );
        });
        it("should be reverted with insufficient allowance error", async () => {
            const signer0 = signers[0];
            const signer1 = signers[1];
            await expect(myTokenC.connect(signers[1])
            .transferFrom(
                signer0.address, 
                signer1.address, 
                hre.ethers.parseUnits("1", DECIMALS))
            ).to.be.revertedWith("insufficient allowance");
        });
        it("should transfer 1Mt from signer0 to signer1", async () => {
            const signer0 = signers[0];
            const signer1 = signers[1];
            console.log("before transfer signer0: ", await myTokenC.balanceOf(signer0.address));    //task3. 이전 balance
            console.log("before transfer signer1: ", await myTokenC.balanceOf(signer1.address));
            await myTokenC.approve(signer1.address, hre.ethers.parseUnits("1", DECIMALS));          //task1. 자산 이동권한 부여
            await myTokenC.connect(signer1).transferFrom(                                           //task2. signer1이 signer0의 MT토큰을 자신의 주소로 전송
                signer0.address, 
                signer1.address, 
                hre.ethers.parseUnits("1", DECIMALS)
            );
            console.log("after transfer signer0: ", await myTokenC.balanceOf(signer0.address));     //task3. 이후 balance
            console.log("after transfer signer1: ", await myTokenC.balanceOf(signer1.address));
            
        });
    });
});