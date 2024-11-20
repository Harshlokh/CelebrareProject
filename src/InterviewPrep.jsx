import { useState, useEffect } from "react";
import { Rnd } from "react-rnd";

function InterviewPrep() {
  const [textValue, setTextValue] = useState("");
  const [fontSize, setFontSize] = useState("16px");
  const [fontStyle, setFontStyle] = useState("normal");
  const [fontFamily, setFontFamily] = useState("Roboto"); // Default font
  const [textColor, setTextColor] = useState("#000000"); // Default color (black)
  const [texts, setTexts] = useState([]);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Load texts and stacks from localStorage on initial load
  useEffect(() => {
    const savedState = JSON.parse(localStorage.getItem("appState"));
    if (savedState) {
      setTexts(savedState.texts);
      setUndoStack(savedState.undoStack);
      setRedoStack(savedState.redoStack);
    }
  }, []);

  // Save state to localStorage whenever there is a change
  useEffect(() => {
    const appState = {
      texts,
      undoStack,
      redoStack,
    };
    localStorage.setItem("appState", JSON.stringify(appState));
  }, [texts, undoStack, redoStack]);

  // Add new text to the canvas
  const handleAddText = () => {
    if (textValue.trim()) {
      const newText = {
        id: texts.length,
        content: textValue,
        fontSize,
        fontStyle,
        fontFamily,
        textColor,
        position: { x: 50, y: 50 },
      };

      // Add the new text to the undo stack
      setUndoStack([...undoStack, { action: "add", text: newText }]);
      setTexts([...texts, newText]);
      setTextValue("");
      setSelectedTextId(null);
      setRedoStack([]); // Clear redo stack when new text is added
    }
  };

  // Handle text drag stop to update the position
  const handleDragStop = (id, x, y) => {
    setTexts((prev) =>
      prev.map((text) =>
        text.id === id ? { ...text, position: { x, y } } : text
      )
    );
  };

  // Handle text deletion
  const handleDeleteText = () => {
    if (selectedTextId !== null) {
      const textToDelete = texts.find((text) => text.id === selectedTextId);

      // Add to undo stack before deleting
      setUndoStack([...undoStack, { action: "delete", text: textToDelete }]);
      setTexts((prev) => prev.filter((text) => text.id !== selectedTextId));
      setSelectedTextId(null);
      setRedoStack([]); // Clear redo stack when text is deleted
    }
  };

  // Handle text edit (when typing in the input box)
  const handleEditText = (id, value) => {
    setTexts((prev) =>
      prev.map((text) =>
        text.id === id ? { ...text, content: value } : text
      )
    );
  };

  // Undo last action
  const handleUndo = () => {
    if (undoStack.length > 0) {
      const lastAction = undoStack[undoStack.length - 1];

      if (lastAction.action === "add") {
        setRedoStack([
          { action: "add", text: texts[texts.length - 1] },
          ...redoStack,
        ]);
        setTexts(texts.slice(0, -1)); // Remove last added text
      } else if (lastAction.action === "delete") {
        setRedoStack([
          { action: "delete", text: lastAction.text },
          ...redoStack,
        ]);
        setTexts([...texts, lastAction.text]); // Re-add the deleted text
      }

      setUndoStack(undoStack.slice(0, -1)); // Remove the last action from undo stack
    }
  };

  // Redo last undone action
  const handleRedo = () => {
    if (redoStack.length > 0) {
      const lastAction = redoStack[0];

      if (lastAction.action === "add") {
        setUndoStack([
          ...undoStack,
          { action: "add", text: lastAction.text },
        ]);
        setTexts([...texts, lastAction.text]); // Re-add the text
      } else if (lastAction.action === "delete") {
        setUndoStack([
          ...undoStack,
          { action: "delete", text: lastAction.text },
        ]);
        setTexts(texts.filter((text) => text.id !== lastAction.text.id)); // Remove the text
      }

      setRedoStack(redoStack.slice(1)); // Remove the first item from redo stack
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      {/* Controls (Undo/Redo) */}
      <div className="flex flex-col justify-between w-full sm:w-auto gap-4 mb-4">
        <button
          onClick={handleUndo}
          className="bg-teal-400 text-black py-2 px-4 rounded-md hover:bg-emerald-500"
          >
          Undo
        </button>
        <button
          onClick={handleRedo}
          className="bg-teal-400 text-black py-2 px-4 rounded-md hover:bg-emerald-500"
        >
          Redo
        </button>
      
      </div>

      {/* Canvas Area */}
      <div className="flex-1 h-[400px] sm:h-[500px] bg-white border border-gray-300 rounded-md shadow-md relative overflow-hidden w-full sm:w-auto">
        {texts.map((text) => (
          <Rnd
            key={text.id}
            default={{
              x: text.position.x,
              y: text.position.y,
              width: "auto",
              height: "auto",
            }}
            bounds="parent"
            onDragStop={(e, d) => handleDragStop(text.id, d.x, d.y)}
            onClick={() => setSelectedTextId(text.id)} // Set selected text on click
          >
            <div
              className={`cursor-pointer p-1 ${
                selectedTextId === text.id ? "underline" : ""
              }`}
              style={{
                fontSize: text.fontSize,
                fontStyle: text.fontStyle,
                fontFamily: text.fontFamily,
                color: text.textColor,
              }}
            >
              {selectedTextId === text.id ? (
                <input
                  type="text"
                  value={text.content}
                  onChange={(e) => handleEditText(text.id, e.target.value)}
                  className="bg-transparent outline-none border-none w-full"
                  autoFocus
                />
              ) : (
                text.content
              )}
            </div>
          </Rnd>
        ))}
      </div>

      {/* Input and Controls */}
      <div className="w-full sm:w-80 flex flex-col items-start gap-4">
        <input
          type="text"
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder="Enter text here..."
          className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex flex-col gap-2 w-full">
          <label className="text-gray-700 font-medium">Font Size</label>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="16px">16px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
            <option value="32px">32px</option>
            <option value="40px">40px</option>
            <option value="48px">48px</option>
            <option value="56px">56px</option>
            <option value="64px">64px</option>
          </select>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <label className="text-gray-700 font-medium">Font Style</label>
          <select
            value={fontStyle}
            onChange={(e) => setFontStyle(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="normal">Normal</option>
            <option value="italic">Italic</option>
            <option value="oblique">Oblique</option>
          </select>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <label className="text-gray-700 font-medium">Font Family</label>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Roboto">Roboto</option>
            <option value="Edu AU VIC WA NT Pre">Edu AU VIC WA NT Pre</option>
            <option value="Londrina Sketch">Londrina Sketch</option>
          </select>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <label className="text-gray-700 font-medium">Text Color</label>
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full focus:outline-none"
          />
        </div>
        <button
          onClick={handleAddText}
          className="bg-black text-white w-full py-2 px-4 rounded-md hover:bg-gray-900"
        >
          Add Text
        </button>
        <button
          onClick={handleDeleteText}
          className="bg-red-500 text-white w-full py-2 px-4 rounded-md hover:bg-red-600"
        >
          Delete Text
        </button>
      </div>
       
      

    </div>
  );
}

export default InterviewPrep;
