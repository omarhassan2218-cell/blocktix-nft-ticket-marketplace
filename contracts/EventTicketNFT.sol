// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title EventTicketNFT
/// @notice An ERC-721 collection where each token represents a ticket for an organizer-created event.
contract EventTicketNFT is ERC721, Ownable {
    using Strings for uint256;
    /// @notice Details that define an event and its ticket inventory.
    struct Event {
        string name;
        uint256 price;
        uint256 maxSupply;
        uint256 eventDate;
        uint256 ticketsMinted;
        bool exists;
    }

    uint256 private _nextEventId;
    uint256 private _nextTokenId;

    /// @notice Maps an event identifier to its event details.
    mapping(uint256 eventId => Event) public events;

    /// @notice Maps a ticket token ID to the event it grants entry to.
    mapping(uint256 tokenId => uint256 eventId) public tokenEventId;

    /// @notice Records whether a ticket has already been redeemed at the event entrance.
    mapping(uint256 tokenId => bool) public ticketRedeemed;

    /// @notice Emitted when the organizer creates an event.
    event EventCreated(uint256 indexed eventId, string name, uint256 price, uint256 maxSupply, uint256 eventDate);

    /// @notice Emitted when a ticket NFT is minted.
    event TicketMinted(uint256 indexed eventId, uint256 indexed tokenId, address indexed attendee);

    /// @notice Emitted when the organizer redeems a ticket at entry.
    event TicketRedeemed(uint256 indexed tokenId, uint256 indexed eventId, address indexed attendee);

    /// @notice Sets the ticket collection name and assigns the deployer as organizer/owner.
    constructor() ERC721("Event Ticket", "ETIX") Ownable(msg.sender) {}

    /// @notice Creates an event that attendees can buy tickets for.
    /// @dev Only the organizer (contract owner) may create events.
    /// @param name Name displayed for the event.
    /// @param price Exact native-currency price, in wei, for one ticket.
    /// @param maxSupply Maximum number of tickets that can be minted.
    /// @param eventDate Unix timestamp for the event date.
    /// @return eventId The unique ID assigned to the new event.
    function createEvent(
        string calldata name,
        uint256 price,
        uint256 maxSupply,
        uint256 eventDate
    ) external onlyOwner returns (uint256 eventId) {
        require(bytes(name).length > 0, "Event name required");
        require(maxSupply > 0, "Max supply must be positive");
        require(eventDate > block.timestamp, "Event must be in future");

        eventId = _nextEventId++;
        events[eventId] = Event({
            name: name,
            price: price,
            maxSupply: maxSupply,
            eventDate: eventDate,
            ticketsMinted: 0,
            exists: true
        });

        emit EventCreated(eventId, name, price, maxSupply, eventDate);
    }

    /// @notice Purchases and mints one ERC-721 ticket for an existing event.
    /// @dev The caller must send exactly the event price, and the event must have tickets remaining.
    /// @param eventId ID of the event for which to mint a ticket.
    /// @return tokenId The ERC-721 token ID of the new ticket.
    function mintTicket(uint256 eventId) external payable returns (uint256 tokenId) {
        Event storage eventDetails = events[eventId];
        require(eventDetails.exists, "Event does not exist");
        require(msg.value == eventDetails.price, "Incorrect ticket price");
        require(eventDetails.ticketsMinted < eventDetails.maxSupply, "Event sold out");

        eventDetails.ticketsMinted += 1;
        tokenId = _nextTokenId++;
        tokenEventId[tokenId] = eventId;
        _safeMint(msg.sender, tokenId);

        emit TicketMinted(eventId, tokenId, msg.sender);
    }

    /// @notice Returns a deterministic metadata path that links a ticket to its event.
    /// @dev Front ends can resolve this path against their metadata host, for example `/events/{eventId}/tickets/{tokenId}`.
    /// @param tokenId ERC-721 ticket token ID.
    /// @return Metadata path containing both the event ID and ticket ID.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string.concat(
            "events/",
            tokenEventId[tokenId].toString(),
            "/tickets/",
            tokenId.toString()
        );
    }

    /// @notice Marks a valid ticket as used after it has been verified at the event entrance.
    /// @dev Only the organizer can redeem tickets, and each token can be redeemed exactly once.
    /// @param tokenId ERC-721 ticket token ID presented for entry.
    function redeemTicket(uint256 tokenId) external onlyOwner {
        address attendee = ownerOf(tokenId);
        require(!ticketRedeemed[tokenId], "Ticket already redeemed");

        ticketRedeemed[tokenId] = true;
        emit TicketRedeemed(tokenId, tokenEventId[tokenId], attendee);
    }

    /// @notice Transfers all ticket sale proceeds to the organizer.
    /// @dev Only the contract owner may withdraw; using call supports contract-based organizers.
    function withdraw() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
}
