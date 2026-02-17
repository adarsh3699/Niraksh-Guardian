import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";

import { apiCall } from "../utils";
import { useAuthContext } from "../contexts/AuthContext";
import Dialog from "../components/showMsg/Dialog";

import stethoscope from "../assets/icons/stethoscope.svg";
import "../styles/assistance.css";

const symptoms = [
	{ name: "Headache", icon: "🤕" },
	{ name: "Fever", icon: "🤒" },
	{ name: "Cough", icon: "😷" },
	{ name: "Fatigue", icon: "😴" },
	{ name: "Sore Throat", icon: "🤧" },
	{ name: "Nausea", icon: "🤢" },
	{ name: "Body Pain", icon: "🩹" },
];

const initialMessage = {
	role: "model",
	parts: [
		{
			text: "👋 Hello! I'm your Smart Healthcare Assistant. How can I help you today? Feel free to describe your symptoms or health concerns, and I'll provide some guidance and precautions.\n\n*Remember, this is not a substitute for professional medical advice.*",
		},
	],
};

const AssistancePage = () => {
	const navigate = useNavigate();
	const { userProfile } = useAuthContext();
	const [chatHistory, setChatHistory] = useState([]);
	const [activeChatId, setActiveChatId] = useState(null);
	const [showSidebar, setShowSidebar] = useState(true);
	
	const [userInput, setUserInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingHistory, setIsLoadingHistory] = useState(true);
	const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
	const [showScrollDownBtn, setShowScrollDownBtn] = useState(false);
	const chatContentRef = useRef(null);
	const inputRef = useRef(null);

	// Dialog state
	const [dialog, setDialog] = useState({
		isOpen: false,
		title: "",
		message: "",
		type: "alert",
		onConfirm: () => {},
		onCancel: () => {},
	});

	// Show dialog helper function
	const showDialog = (title, message, options = {}) => {
		setDialog({
			isOpen: true,
			title,
			message,
			type: options.type || "alert",
			confirmText: options.confirmText || "OK",
			cancelText: options.cancelText || "Cancel",
			onConfirm: options.onConfirm || (() => setDialog(prev => ({ ...prev, isOpen: false }))),
			onCancel: options.onCancel || (() => setDialog(prev => ({ ...prev, isOpen: false }))),
		});
	};

	// Get active chat messages
	const activeChat = chatHistory.find(chat => chat._id === activeChatId) || chatHistory[0];
	const messages = activeChat?.messages || [initialMessage];

	// Fetch chat history from database
	useEffect(() => {
		const fetchChatHistory = async () => {
			try {
				setIsLoadingHistory(true);
				const response = await apiCall("chats", "GET");
				
				if (response.data && Array.isArray(response.data)) {
					setChatHistory(response.data);
					
					// Set active chat to the most recent one if available
					if (response.data.length > 0) {
						setActiveChatId(response.data[0]._id);
					} else {
						// If no chats exist, create a new one
						createNewChat();
					}
				}
			} catch (error) {
				console.error("Error fetching chat history:", error);
				// If there's an error, create a new chat so the user can start
				createNewChat();
			} finally {
				setIsLoadingHistory(false);
			}
		};

		fetchChatHistory();
	}, []);

	// Save sidebar visibility preference to localStorage
	useEffect(() => {
		localStorage.setItem("healthAssistantSidebarVisible", JSON.stringify(showSidebar));
	}, [showSidebar]);

	// Check if scroll is at bottom
	useEffect(() => {
		const chatContent = chatContentRef.current;

		const handleScroll = () => {
			if (!chatContent) return;

			const isScrolledUp = chatContent.scrollHeight - chatContent.scrollTop > chatContent.clientHeight + 100;
			setShowScrollDownBtn(isScrolledUp);
		};

		if (chatContent) {
			chatContent.addEventListener("scroll", handleScroll);
			return () => chatContent.removeEventListener("scroll", handleScroll);
		}
	}, []);

	// Scroll to bottom whenever messages change
	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const scrollToBottom = () => {
		if (chatContentRef.current) {
			chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
			setShowScrollDownBtn(false);
		}
	};

	// Create a new chat in the database
	const createNewChat = async () => {
		try {
			const response = await apiCall("chats", "POST", {
				title: "New Chat",
				messages: [initialMessage],
			});
			
			if (response.data) {
				setChatHistory(prev => [response.data, ...prev]);
				setActiveChatId(response.data._id);
			}
		} catch (error) {
			console.error("Error creating new chat:", error);
			showDialog(
				"Error",
				"Failed to create a new chat. Please try again.",
				{ type: "error" }
			);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setUserInput("");

		if (!userInput.trim() || !activeChatId) return;

		const newMessage = { role: "user", parts: [{ text: userInput }] };

		// Update UI immediately
		const updatedChatHistory = chatHistory.map(chat => {
			if (chat._id === activeChatId) {
				// Update chat title if this is the first user message
				const isFirstUserMessage = chat.messages.length === 1 && chat.messages[0].role === "model";
				const title = isFirstUserMessage ? userInput.slice(0, 30) + (userInput.length > 30 ? "..." : "") : chat.title;
				
				return {
					...chat,
					title: title,
					messages: [...chat.messages, newMessage],
				};
			}
			return chat;
		});

		setChatHistory(updatedChatHistory);
		setIsLoading(true);

		try {
			// First update the chat in the database with the user message
			await apiCall(`chats/${activeChatId}`, "PUT", {
				title: updatedChatHistory.find(chat => chat._id === activeChatId).title,
				messages: [...updatedChatHistory.find(chat => chat._id === activeChatId).messages],
			});

			// Then get the AI response
			const response = await apiCall("ai/disease", "POST", {
				history: activeChat.messages,
				msg: userInput,
			});

			const botMessage = { role: "model", parts: [{ text: response?.data.description }] };
			
			// Update local state with bot response
			const finalUpdatedChatHistory = updatedChatHistory.map(chat => {
				if (chat._id === activeChatId) {
					return {
						...chat,
						messages: [...chat.messages, botMessage],
					};
				}
				return chat;
			});
			
			setChatHistory(finalUpdatedChatHistory);
			
			// Update the chat in the database with bot response
			await apiCall(`chats/${activeChatId}`, "PUT", {
				messages: [...finalUpdatedChatHistory.find(chat => chat._id === activeChatId).messages],
			});

		} catch (error) {
			console.error("Error:", error);
			const errorMessage = {
				role: "model",
				parts: [{ text: "❌ Sorry, I encountered an error. Please try again later." }],
			};
			
			// Update local state with error message
			setChatHistory(prev => prev.map(chat => {
				if (chat._id === activeChatId) {
					return {
						...chat,
						messages: [...chat.messages, errorMessage],
					};
				}
				return chat;
			}));
			
			// Try to update the database with the error message
			try {
				await apiCall(`chats/${activeChatId}`, "PUT", {
					messages: [...updatedChatHistory.find(chat => chat._id === activeChatId).messages, errorMessage],
				});
			} catch (updateError) {
				console.error("Error updating chat with error message:", updateError);
			}
		} finally {
			setIsLoading(false);
			if (inputRef.current) {
				inputRef.current.focus();
			}
		}
	};

	const handleQuickAction = (symptom) => {
		setUserInput((prev) => (prev ? `${prev}, ${symptom}` : symptom));
		if (inputRef.current) {
			inputRef.current.focus();
		}
	};

	const startNewChat = () => {
		createNewChat();
	};

	const switchChat = (chatId) => {
		setActiveChatId(chatId);
	};

	const deleteChat = async (chatId, e) => {
		e.stopPropagation();
		
		if (chatHistory.length === 1) {
			showDialog(
				"Cannot Delete",
				"You can't delete the only remaining chat.",
				{ type: "warning" }
			);
			return;
		}
		
		showDialog(
			"Delete Chat",
			"Are you sure you want to delete this chat?",
			{
				type: "confirm",
				confirmText: "Delete",
				onConfirm: async () => {
					try {
						await apiCall(`chats/${chatId}`, "DELETE");
						
						const newChatHistory = chatHistory.filter(chat => chat._id !== chatId);
						setChatHistory(newChatHistory);
						
						// If the active chat is deleted, set the first available chat as active
						if (chatId === activeChatId) {
							setActiveChatId(newChatHistory[0]._id);
						}
						
						setDialog(prev => ({ ...prev, isOpen: false }));
					} catch (error) {
						console.error("Error deleting chat:", error);
						showDialog(
							"Error",
							"Failed to delete the chat. Please try again.",
							{ type: "error" }
						);
					}
				}
			}
		);
	};

	const toggleSidebar = () => {
		setShowSidebar(prev => !prev);
	};

	const navigateToDoctorSuggest = async () => {
		if (messages.length <= 1) {
			showDialog(
				"No Conversation Data",
				"Please have a conversation about your symptoms first before getting doctor recommendations.",
				{ type: "warning" }
			);
			return;
		}

		try {
			setIsGeneratingSummary(true);

			// Call the new API endpoint to summarize symptoms
			const response = await apiCall("ai/summarize-symptoms", "POST", {
				chatHistory: messages,
			});

			if (response?.data?.status === "non_medical") {
				// Show a dialog informing the user their conversation isn't healthcare related
				showDialog(
					"No Medical Content Detected",
					"Your conversation doesn't appear to contain any healthcare-related information or symptoms. Please discuss your medical concerns to get doctor recommendations.",
					{ type: "warning" }
				);
				
				// Still navigate but with a flag that this is non-medical content
				if (response?.data?.summary) {
					sessionStorage.setItem("symptomSummary", response.data.summary);
					navigate("/doctor_suggest");
				}
			} else if (response?.data?.summary) {
				// Save the summary in sessionStorage
				sessionStorage.setItem("symptomSummary", response.data.summary);

				// Navigate to doctor suggest page
				navigate("/doctor_suggest");
			} else {
				throw new Error("Failed to summarize symptoms");
			}
		} catch (error) {
			console.error("Error generating symptom summary:", error);
			showDialog(
				"Analysis Error",
				"Sorry, there was an error analyzing your symptoms. Please try again.",
				{ type: "error" }
			);
		} finally {
			setIsGeneratingSummary(false);
		}
	};

	// Format date for sidebar display
	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	if (isLoadingHistory) {
		return (
			<div id="assistancePage" className="loading-state">
				<div className="loading-container">
					<div className="loading-spinner large"></div>
					<p>Loading your chat history...</p>
				</div>
			</div>
		);
	}

	return (
		<div id="assistancePage" className={showSidebar ? "with-sidebar" : ""}>
			{/* Custom Dialog Component */}
			<Dialog
				isOpen={dialog.isOpen}
				title={dialog.title}
				message={dialog.message}
				type={dialog.type}
				confirmText={dialog.confirmText}
				cancelText={dialog.cancelText}
				onConfirm={dialog.onConfirm}
				onCancel={dialog.onCancel}
			/>

			<div className={`chat-sidebar ${showSidebar ? "visible" : "hidden"}`}>
				<div className="sidebar-header">
					<h2>Chat History</h2>
					<button className="new-chat-sidebar-btn" onClick={startNewChat} title="Start a new chat">
						<span>+</span> New Chat
					</button>
				</div>
				<div className="chat-history-list">
					{chatHistory.map(chat => (
						<div 
							key={chat._id} 
							className={`chat-history-item ${chat._id === activeChatId ? "active" : ""}`}
							onClick={() => switchChat(chat._id)}
						>
							<div className="chat-item-content">
								<div className="chat-item-title">{chat.title}</div>
								<div className="chat-item-date">{formatDate(chat.updatedAt || chat.createdAt)}</div>
							</div>
							<button 
								className="delete-chat-btn" 
								onClick={(e) => deleteChat(chat._id, e)}
								title="Delete this chat"
							>
								🗑️
							</button>
						</div>
					))}
				</div>
			</div>

			<div className="chat-main">
				<div className="chat-header">
					<div className="header-left">
						<button className="toggle-sidebar-btn" onClick={toggleSidebar}>
							{showSidebar ? "◀" : "▶"}
						</button>
						<img src={stethoscope} alt="" height="30" />
						<h1>Smart Healthcare Assistant</h1>
					</div>
					<div className="header-buttons">
						<button className="new-chat-btn" onClick={startNewChat} title="Start a new conversation">
							<span>🔄</span> New Chat
						</button>
						<button
							className="doctor-recommend-btn"
							onClick={navigateToDoctorSuggest}
							disabled={isGeneratingSummary || isLoading || messages.length <= 1}
							title="Get doctor recommendations based on your symptoms"
						>
							{isGeneratingSummary ? (
								<>
									<span className="loading-spinner"></span> Analyzing...
								</>
							) : (
								<>
									<span>👨‍⚕️</span> Find Doctors
								</>
							)}
						</button>
					</div>
				</div>

				<div className="chat-container">
					<div className="chat-content" id="chatContent" ref={chatContentRef}>
						{messages.map((msg, index) => (
							<div key={index} className={`message-container ${msg.role}`}>
								{msg.role === "model" && <div className="avatar assistant-avatar">🩺</div>}
								<ReactMarkdown className={`message ${msg.role}`}>{msg.parts[0].text}</ReactMarkdown>
								{msg.role === "user" && <div className="avatar user-avatar">👤</div>}
							</div>
						))}

						{isLoading && (
							<div className="message-container model">
								<div className="avatar assistant-avatar">🩺</div>
								<div className="message model loading">
									<div className="typing-indicator">
										<span></span>
										<span></span>
										<span></span>
									</div>
								</div>
							</div>
						)}

						{showScrollDownBtn && (
							<button
								className="scroll-to-bottom-btn"
								onClick={scrollToBottom}
								title="Scroll to latest messages"
							>
								↓
							</button>
						)}
					</div>

					<div className="chat-footer">
						<form className="chat-form" onSubmit={handleSubmit}>
							<input
								ref={inputRef}
								type="text"
								placeholder="Describe your symptoms or ask a health question..."
								className="chat-input"
								name="userInput"
								value={userInput}
								autoComplete="off"
								onChange={(e) => setUserInput(e.target.value)}
								disabled={isLoading || isGeneratingSummary}
							/>
							<button
								type="submit"
								className="chat-button"
								disabled={isLoading || isGeneratingSummary || !userInput.trim()}
								title="Send message"
							>
								{isLoading ? <span className="loading-spinner small"></span> : "Send"}
							</button>
						</form>

						<div className="quick-actions">
							<div className="quick-actions-label">Common symptoms:</div>
							<div className="quick-actions-buttons">
								{symptoms.map((symptom) => (
									<button
										key={symptom.name}
										className="quick-action-btn"
										onClick={() => handleQuickAction(symptom.name)}
										disabled={isLoading || isGeneratingSummary}
										title={`Add "${symptom.name}" to your message`}
									>
										<span className="symptom-icon">{symptom.icon}</span>
										<span className="symptom-name">{symptom.name}</span>
									</button>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AssistancePage;
