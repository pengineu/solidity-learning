import hre from "hardhat";
import { expect } from "chai";
import { DECIMALS, MINTING_AMOUNT } from "./constants";

describe("TinyBank", () => {
    let signers: HardhatEthersSigner[];
    let myTokenC: MyToken;
    let tinyBankC: TinyBank;
    beforeEach(async () => {
        signers = await hre.ethers.getSigners();
        myTokenC = await hre.ethers.deployContract("MyToken", [
            "MyToken", 
            "Mt", 
            DECIMALS,
            MINTING_AMOUNT,
        ])
        tinyBankC = await hre.ethers.deployContract("TinyBank", [
            await myTokenC.getAddress()
        ])
        await myTokenC.setManager(tinyBankC.getAddress());
        await tinyBankC.setManagers(signers[4].address, signers[5].address, signers[6].address);    //assignment 3-1: 3명 이상의 manager를 등록
    })

    describe("Initialized state check", () => {
        it("should return totalStaked 0", async () => {
            expect(await tinyBankC.totalStaked()).equal(0);
        })
        it("should return staked 0 amount of signer0", async () => {
            const signer0 = signers[0];
            expect(await tinyBankC.staked(signer0.address)).equal(0);
        })
    })

    describe("Staking", async () => {
        it("should return staked amount", async () => {
            const signer0 = signers[0];
            const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
            await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
            await tinyBankC.stake(stakingAmount);
            expect(await tinyBankC.staked(signer0.address)).equal(stakingAmount);
            expect(await myTokenC.balanceOf(tinyBankC)).equal(await tinyBankC.totalStaked());
            expect(await tinyBankC.totalStaked()).equal(stakingAmount);
        })
    })
    describe("Withdraw", () => {
        it("should return 0 staked after withdrawing total token", async () => {
            const signer0 = signers[0];
            const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
            await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
            await tinyBankC.stake(stakingAmount);
            await tinyBankC.withdraw(stakingAmount);
            expect(await tinyBankC.staked(signer0.address)).equal(0);
        })
    })

    describe("reward", () => {
        it("should reward 1MT every blocks", async () => {
            const signer0 = signers[0];
            const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
            await myTokenC.approve( await tinyBankC.getAddress(), stakingAmount);
            await tinyBankC.stake(stakingAmount);

            const BLOCKS = 5n;
            const transferAmount = hre.ethers.parseUnits("1", DECIMALS);
            for (var i = 0; i < BLOCKS; i++) {
                await myTokenC.transfer(transferAmount, signer0.address);
            }

            await tinyBankC.withdraw(stakingAmount);
            expect(await myTokenC.balanceOf(signer0.address)).equal(
                hre.ethers.parseUnits((BLOCKS + 1n + MINTING_AMOUNT).toString())
            );
        })
        
        //assignment 3-2: test 코드 완성
        it("Should revert when changing rewardPerBlock by hacker", async () => {
            const hacker = signers[3];                                                          //hacker는 manager가 아닌 signer3번
            const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);
            await expect(tinyBankC.connect(hacker).setRewardPerBlock(rewardToChange)).to.be.revertedWith("You are not a manager");  //manager가 아니기 때문에 revert
        })

        it("Should revert when changing rewardPerBlock by unconfirmed manager", async () => {
            await tinyBankC.confirm();                                                          //signer0번(배포자, manager) confirm
            await tinyBankC.connect(signers[4]).confirm();                                      //signer4번(manager) confirm
            await tinyBankC.connect(signers[5]).confirm();                                      //signer5번(manager) confirm
            const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);
            await expect(tinyBankC.setRewardPerBlock(rewardToChange)).to.be.revertedWith("Not all confirmed yet");  //signer6번이 confirm하지 않았기 때문에 revert
        })

        it("Should change rewardPerBlock by confirmed managers", async () => {
            await tinyBankC.confirm();                                                          //signer0번(배포자, manager) confirm
            await tinyBankC.connect(signers[4]).confirm();                                      //signer4번(manager) confirm
            await tinyBankC.connect(signers[5]).confirm();                                      //signer5번(manager) confirm
            await tinyBankC.connect(signers[6]).confirm();                                      //signer6번(manager) confirm
            const rewardToChange = hre.ethers.parseUnits("2", DECIMALS);
            await tinyBankC.setRewardPerBlock(rewardToChange);                                  //모두 confirmed manager이기 때문에 통과
        })
    })
})