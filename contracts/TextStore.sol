contract TextStore {
	string public text;

	event OnTextSet(string text);

	function setText(string newText) 
		returns (bool success) {
		text = newText;
		OnTextSet(newText);
		success = true;
	}
}