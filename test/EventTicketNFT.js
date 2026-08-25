const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EventTicketNFT", function () {
  async function deployFixture() {
    const [organizer, attendee] = await ethers.getSigners();
    const Ticket = await ethers.getContractFactory("EventTicketNFT");
    const ticket = await Ticket.deploy();
    await ticket.waitForDeployment();
    return { ticket, organizer, attendee };
  }

  it("lets the organizer create an event and an attendee mint its ticket", async function () {
    const { ticket, attendee } = await deployFixture();
    const price = ethers.parseEther("0.05");
    const eventDate = (await ethers.provider.getBlock("latest")).timestamp + 86_400;

    await expect(ticket.createEvent("Solidity Summit", price, 100, eventDate))
      .to.emit(ticket, "EventCreated")
      .withArgs(0, "Solidity Summit", price, 100, eventDate);

    await expect(ticket.connect(attendee).mintTicket(0, { value: price }))
      .to.emit(ticket, "TicketMinted")
      .withArgs(0, 0, attendee.address);

    expect(await ticket.ownerOf(0)).to.equal(attendee.address);
    expect(await ticket.tokenEventId(0)).to.equal(0);
    expect(await ticket.tokenURI(0)).to.equal("events/0/tickets/0");
    expect((await ticket.events(0)).ticketsMinted).to.equal(1);
  });

  it("rejects incorrect payments and mints beyond max supply", async function () {
    const { ticket, attendee } = await deployFixture();
    const eventDate = (await ethers.provider.getBlock("latest")).timestamp + 86_400;
    await ticket.createEvent("Limited event", 100n, 1, eventDate);

    await expect(ticket.connect(attendee).mintTicket(0, { value: 99n }))
      .to.be.revertedWith("Incorrect ticket price");
    await ticket.connect(attendee).mintTicket(0, { value: 100n });
    await expect(ticket.connect(attendee).mintTicket(0, { value: 100n }))
      .to.be.revertedWith("Event sold out");
  });

  it("allows the organizer to redeem each ticket only once", async function () {
    const { ticket, attendee } = await deployFixture();
    const eventDate = (await ethers.provider.getBlock("latest")).timestamp + 86_400;
    await ticket.createEvent("Gate test", 0, 1, eventDate);
    await ticket.connect(attendee).mintTicket(0);

    await expect(ticket.redeemTicket(0))
      .to.emit(ticket, "TicketRedeemed")
      .withArgs(0, 0, attendee.address);
    expect(await ticket.ticketRedeemed(0)).to.equal(true);
    await expect(ticket.redeemTicket(0)).to.be.revertedWith("Ticket already redeemed");
  });
});
