pragma solidity ^0.4.10;

contract TextStore {
    string public text;

    event LogTextSet(address indexed sender, string text, bytes data);
    event LogFallback(address indexed sender, bytes data);

    function setText(string newText) 
        returns (bool success) {
        text = newText;
        LogTextSet(msg.sender, newText, msg.data);
        success = true;
    }

    function() {
        LogFallback(msg.sender, msg.data);
    }
}