contract TextStore {
	string public text;

	event OnTextSet(string text);
	event OnData(bytes data);

	function setText(string newText) 
		returns (bool success) {
		text = newText;
		OnTextSet(newText);
		OnData(msg.data);
		success = true;
	}
}