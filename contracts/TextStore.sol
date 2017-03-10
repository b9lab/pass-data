pragma solidity ^0.4.5;

contract TextStore {
    string public text;

    event OnTextSet(string text, bytes data);

    function setText(string newText) 
        returns (bool success) {
        text = newText;
        OnTextSet(newText, msg.data);
        success = true;
    }
}