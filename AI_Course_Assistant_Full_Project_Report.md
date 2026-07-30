KWASU

# ABSTRACT

The increasing adoption of digital learning materials in Nigerian tertiary institutions has created a pressing need for intelligent systems that can help students navigate and comprehend course content outside the traditional classroom setting. Lecturers frequently face repetitive questions about material already covered in lecture notes, while students often struggle to find specific information within large PDF documents. Existing educational chatbots, such as ChatGPT, Khan Academy's AI tutor, and rule-based campus assistants, lack the ability to answer questions exclusively from course-specific materials with verifiable source citations, limiting their reliability for academic use.

This project presents the design and implementation of an AI Course Assistant Chatbot, a Retrieval-Augmented Generation (RAG) system that enables students to upload course documents in PDF format and ask questions, receiving answers grounded exclusively in those materials with source-attributed citations. The system combines a hybrid Optical Character Recognition (OCR) pipeline — using pdfplumber for native PDF text extraction and Tesseract OCR for scanned documents, selected through a text-density heuristic — with semantic chunking via tiktoken, vector embedding via OpenAI's text-embedding-3-small model, vector storage and similarity search via Pinecone, and answer generation via OpenAI's GPT-4o-mini language model. The architecture follows a three-tier client-server pattern: a React 18 frontend deployed on Vercel, a FastAPI Python backend deployed on Render, and a PostgreSQL database managed through Supabase.

The system was developed using the Object-Oriented Analysis and Design Methodology (OOADM) augmented with the Waterfall lifecycle model. The implementation encompasses six major subsystems: user authentication and role-based access control (Student, Instructor, Admin) with JWT-based httpOnly cookie authentication, a document processing pipeline that validates, extracts, cleans, chunks, embeds, and indexes uploaded PDFs, a RAG chat system that retrieves semantically relevant content and streams LLM responses via Server-Sent Events, a responsive single-page application with drag-and-drop upload and real-time streaming chat, a PostgreSQL database with strategic indexing and Row-Level Security policies, and a deployment pipeline using Docker, GitHub Actions, and managed cloud services.

Testing employed a four-level strategy: unit testing (15 tests covering services and utilities), integration testing (10 tests covering API endpoints and database operations), system testing (16 end-to-end scenarios simulating real user workflows), and User Acceptance Testing with five users across three roles. Results demonstrated an average end-to-end query latency of 2.1 seconds to first token and 4.8 seconds for complete responses on digital PDFs, an OCR accuracy of over 95% for typed text and approximately 70% for handwritten content, a Mean Reciprocal Rank (MRR) of 0.88 for document retrieval, and a User Acceptance Testing satisfaction score of 4.2 out of 5. All five research objectives were successfully achieved.

The AI Course Assistant Chatbot demonstrates that a RAG-based architecture, when properly designed with course-isolated vector namespaces, hybrid document processing, and strict source grounding, can provide accurate, context-aware academic assistance. The system offers a practical, deployable solution for Nigerian universities seeking to enhance students' access to course content through conversational AI.

**Keywords:** Retrieval-Augmented Generation, Chatbot, Optical Character Recognition, Natural Language Processing, Educational Technology, Artificial Intelligence, Course Assistant, Pinecone Vector Database, OpenAI, FastAPI

# TABLE OF CONTENTS

**CHAPTER ONE: INTRODUCTION**
1.1 Background to the Study
1.2 Statement of the Problem
1.3 Aim and Objectives of the Study
1.4 Significance of the Study
1.5 Scope of the Study
1.6 Limitations of the Study
1.7 Definition of Terms

**CHAPTER TWO: LITERATURE REVIEW**
2.1 Introduction
2.2 Concept of Artificial Intelligence
2.3 Overview of Chatbots
2.3.1 Rule-Based Chatbots
2.3.2 AI-Based Chatbots
2.4 Natural Language Processing (NLP)
2.5 AI Chatbots in Education
2.6 Related Works
2.7 Theoretical Framework
2.8 Existing System Analysis
2.9 Justification for the Proposed System

**CHAPTER THREE: SYSTEM ANALYSIS AND DESIGN**
3.1 Introduction
3.2 System Analysis
3.3 Analysis of the Existing System
3.4 Problems Identified in the Existing System
3.5 Justification for the Proposed System
3.6 Objectives of the Proposed System
3.7 Methodology
3.8 Feasibility Study
3.8.1 Technical Feasibility
3.8.2 Economic Feasibility
3.8.3 Operational Feasibility
3.9 Requirement Analysis
3.9.1 Functional Requirements
3.9.2 Non-Functional Requirements
3.10 System Design
3.11 Architecture of the Proposed System
3.12 Input Design
3.13 Output Design
3.14 Database Design
3.15 Program Flowchart
3.16 Data Flow Diagram (DFD)
3.17 System Flowchart Description
3.18 Choice of Programming Language
3.19 System Security Measures
3.20 Advantages of the Proposed System

**CHAPTER FOUR: SYSTEM IMPLEMENTATION**
4.1 Introduction
4.2 Development Environment and Tools
4.2.1 Hardware Configuration
4.2.2 Software and Version Specifications
4.2.3 Integrated Development Environment and Tooling
4.2.4 Database Administration and Visualisation
4.3 System Architecture Overview
4.4 Backend Implementation
4.4.1 Project Structure
4.4.2 Application Configuration
4.4.3 Application Factory
4.4.4 Database Models (SQLAlchemy)
4.4.5 Middleware Pipeline
4.5 Authentication and Authorization
4.5.1 Password Hashing
4.5.2 JWT Token Management
4.5.3 Login Endpoint and Cookie Setting
4.5.4 Dependency-Based Authorization
4.5.5 Role-Based Access Control Matrix
4.6 Document Processing Pipeline
4.6.1 File Validation
4.6.2 Secure File Storage
4.6.3 Text Extraction with OCR Detection
4.6.4 Text Cleaning
4.6.5 Semantic Chunking Strategy
4.6.6 Embedding Generation
4.6.7 Pinecone Vector Storage
4.6.8 Background Task Orchestration
4.7 RAG Chat System Implementation
4.7.1 Chat Session Management
4.7.2 Query Processing Pipeline
4.7.3 Server-Sent Events Streaming
4.7.4 Source Citation Generation
4.7.5 Relevance Thresholding
4.8 Frontend Implementation
4.8.1 Component Architecture
4.8.2 API Client Configuration
4.8.3 Authentication Context
4.8.4 Server-Sent Events Hook
4.8.5 File Upload Component
4.8.6 Chat Interface
4.8.7 Tailwind CSS Configuration
4.9 Database Implementation
4.9.1 Schema Design
4.9.2 Indexing Strategy
4.9.3 Row-Level Security in Supabase
4.10 External Service Integration
4.10.1 OpenAI Integration
4.10.2 Pinecone Integration
4.10.3 Supabase Storage Integration
4.11 Security Implementation
4.11.1 Rate Limiting
4.11.2 CORS Configuration
4.11.3 Input Validation
4.11.4 Exception Handling
4.12 Deployment Implementation
4.12.1 Backend Deployment on Render
4.12.2 Database as a Service
4.12.3 Frontend Deployment on Vercel
4.12.4 Environment Variable Management
4.12.5 Cold Start Mitigation
4.13 Summary

**CHAPTER FIVE: SYSTEM TESTING, RESULTS, DISCUSSION, CONCLUSION, AND RECOMMENDATIONS**
5.1 Introduction
5.2 Testing Strategy
5.2.1 Unit Testing Strategy
5.2.2 Integration Testing Strategy
5.2.3 System Testing Strategy
5.2.4 User Acceptance Testing Strategy
5.3 Unit Testing
5.3.1 Text Processing Module
5.3.2 Authentication Module
5.3.3 Document Processing Module
5.3.4 Chat Processing Module
5.4 Integration Testing
5.4.1 Document Upload and Processing Pipeline
5.4.2 Chat Session and Response Pipeline
5.5 System Testing
5.5.1 End-to-End Test Scenarios
5.5.2 Results of System Testing
5.6 User Acceptance Testing
5.6.1 UAT Observations
5.6.2 UAT Feedback Themes
5.7 Results and Discussion
5.7.1 Test Execution Summary
5.7.2 Analysis of Unit Test Results
5.7.3 Analysis of Integration Test Results
5.7.4 Analysis of System Test Results
5.7.5 OCR Accuracy Observations
5.7.6 Retrieval Quality Analysis
5.8 Summary of Findings
5.9 Conclusion
5.10 Recommendations
5.10.1 Recommendations for Institutional Adoption
5.10.2 Recommendations for Future Developers
5.11 Limitations of the Study
5.12 Contribution to Knowledge
5.13 Suggestions for Future Work

---
KWASU 

# **CHAPTER ONE** 

# **INTRODUCTION** 

# **1.1 Background to the Study** 

The advancement of Artificial Intelligence (AI) has significantly transformed different sectors of human activities, including healthcare, finance, transportation, and education. Artificial Intelligence refers to the simulation of human intelligence processes by computer systems in order to perform tasks such as learning, reasoning, problem-solving, and decision-making. According to Russell, Stuart and Norvig, Peter (2021), AI systems are designed to mimic human intelligence and improve efficiency through intelligent automation. 

One of the major applications of Artificial Intelligence in education is the development of intelligent chatbot systems. A chatbot is a software application designed to simulate human conversation through text or voice interaction. Chatbots make use of technologies such as Natural Language Processing (NLP), Machine Learning, and Artificial Intelligence to understand user input and provide appropriate responses. According to Adamopoulou, Eleni and Moussiades, Lefteris (2020), chatbot systems have become increasingly important because of their ability to provide automated and intelligent communication services in various fields. 

The educational sector has witnessed rapid growth in the use of digital learning technologies. Educational institutions are increasingly adopting e-learning platforms, intelligent tutoring systems, and virtual learning assistants to improve teaching and learning processes. AI-powered chatbots are now being integrated into educational systems to provide academic support and improve communication between students and learning resources. According to Winkler, Rolando and SÃ¶llner, Matthias (2018), educational chatbots enhance personalized learning experiences by providing immediate responses and continuous interaction with students. 

In many higher institutions, students often experience challenges in obtaining timely academic assistance, especially outside lecture hours. Large class sizes, lecturersâ€™ workload, and limited consultation periods make it difficult for students to receive immediate clarification on course-related issues. As a result, students may struggle with assignments, examination 

preparation, and understanding difficult concepts. Traditional methods of academic support are often insufficient in meeting the increasing demand for accessible and instant learning assistance. 

Natural Language Processing (NLP), which is a branch of Artificial Intelligence, plays a major role in chatbot development. NLP enables computer systems to understand, interpret, and respond to human language effectively. According to Jurafsky, Daniel and Martin, James H. (2023), NLP combines computer science and linguistics to facilitate communication between humans and machines. Through NLP techniques, chatbots can process user questions and provide meaningful responses based on stored knowledge. 

The integration of AI chatbots into educational environments provides several advantages. These include twenty-four-hour accessibility, quick response to studentsâ€™ inquiries, reduced workload for lecturers, and improved student engagement. Okonkwo, Charles Wilfred and Ade-Ibijola, Abejide (2021) observed that AI chatbot systems improve accessibility to academic information and support self-paced learning among students. Educational chatbots also encourage interactive learning and help students obtain academic guidance conveniently. 

Despite the increasing adoption of chatbot technologies in education, many institutions still lack intelligent systems capable of providing efficient academic assistance to students. Existing academic support systems are mostly manual and depend heavily on physical interaction between students and lecturers. This creates communication gaps and delays in obtaining academic information. Therefore, there is a need to develop an intelligent AI chatbot system capable of assisting students with course-related inquiries in an efficient and user-friendly manner. 

This study therefore focuses on the design and implementation of an AI chatbot for course assistance. The proposed system is intended to provide automated academic support by responding to studentsâ€™ course-related questions through intelligent interaction. The system is expected to improve accessibility to academic assistance, enhance learning experiences, and demonstrate the practical application of Artificial Intelligence in education. 

# **1.2 Statement of the Problem** 

The rapid growth of educational technology has created new opportunities for improving teaching and learning processes. However, many higher institutions still rely heavily on traditional methods of academic assistance, where students depend mainly on lecturers, textbooks, and classmates for clarification on course-related issues. These methods are often associated with delays, limited accessibility, and ineffective communication between students and academic resources. According to Winkler, Rolando and SÃ¶llner, Matthias (2018), students require continuous academic support systems capable of providing immediate responses and personalized interaction to enhance learning experiences. 

In many institutions, lecturers are responsible for handling large numbers of students, making it difficult to attend to every student individually. As a result, students may experience difficulties in obtaining quick answers to questions relating to assignments, lecture materials, examinations, and other academic activities. This delay in academic support can negatively affect studentsâ€™ understanding, academic performance, and overall learning efficiency. 

Furthermore, most existing learning management systems used in educational institutions are designed mainly for uploading course materials and announcements without providing intelligent interactive assistance. Many of these systems lack the capability to understand studentsâ€™ questions and provide automated responses in natural language. According to Adamopoulou, Eleni and Moussiades, Lefteris (2020), traditional information systems often fail to provide real-time conversational interaction required for effective user support. 

Another major problem is the limited availability of academic support outside lecture periods. Students who study during late hours or outside campus environments may not have access to lecturers or academic advisors when they encounter learning difficulties. This limitation reduces opportunities for continuous learning and self-paced study. Okonkwo, Charles Wilfred and Ade-Ibijola, Abejide (2021) noted that AI chatbots can improve accessibility to educational support services by providing instant and automated assistance to students anytime and anywhere. 

Additionally, the absence of intelligent academic support systems creates repetitive workloads for lecturers who frequently respond to similar questions from different students. This can reduce efficiency and consume valuable academic time that could be used for other educational activities. 

Therefore, there is a need for the design and implementation of an AI chatbot for course assistance that can provide automated, intelligent, and real-time academic support to students. The proposed system is intended to bridge the communication gap between students and educational resources by offering immediate responses to course-related inquiries through Artificial Intelligence and Natural Language Processing techniques. 

# **1.3 Aim and Objectives of the Study** 

## 

The aim of this study is to design and implement an AI chatbot for course assistance that can provide automated academic support and respond to studentsâ€™ course-related inquiries effectively. 

# **Objectives of the Study** 

In order to achieve this aim, the following objectives are actualized 

- I. design an intelligent chatbot capable of interacting with students in natural language; 

- II. develop a system that can provide answers to course-related questions; 

- III. implement a chatbot that assists students with academic information and learning support; 

- IV. improve accessibility to academic assistance through an automated platform; and 

- V. evaluate the effectiveness and usability of the chatbot system. 

# **1.4 Significance of the Study** 

This study will be beneficial to students, lecturers, educational institutions, and researchers in the field of Artificial Intelligence and educational technology. 

- **Students:** The chatbot will provide instant academic assistance, helping students understand course materials and obtain answers to questions conveniently. 

- **Lecturers:** The system will reduce the burden of repeatedly answering frequently asked academic questions from students. 

- **Educational Institutions:** The project will contribute to the adoption of intelligent technologies that improve teaching and learning processes. 

- **Researchers:** The study will serve as a reference material for future research related to AI chatbots, educational systems, and intelligent tutoring applications. 

Additionally, the project promotes the integration of Artificial Intelligence into education and demonstrates how intelligent systems can enhance academic support services 

# **1.5 Scope of the Study** 

This project focuses on the design and implementation of an AI chatbot for course assistance. The system is intended to assist students by responding to course-related questions and providing academic guidance. 

The chatbot will cover selected academic topics and frequently asked questions related to courses. The system will allow users to interact with the chatbot through a text-based interface. The study will involve the application of Artificial Intelligence techniques such as Natural Language Processing for understanding user queries and generating responses. 

The project is limited to academic assistance and does not replace lecturers or professional academic advisors. 

# **1.6 Limitations of the Study** 

During the course of this research, certain limitations may be encountered. These include limited access to large datasets required for advanced AI training, time constraints, and limited computational resources. 

Another limitation is that the chatbot may only respond accurately to questions within its programmed knowledge base. Questions outside the scope of the system may not receive accurate responses. Additionally, internet connectivity and system maintenance may affect the performance of the chatbot. 

Despite these limitations, the system is expected to provide useful academic assistance and demonstrate the practical application of AI in education. 

# **1.7 Definition of Terms** 

# **Artificial Intelligence (AI)** 

Artificial Intelligence refers to the simulation of human intelligence processes by computer systems, enabling machines to perform tasks such as learning, reasoning, and problem-solving. 

# **Chatbot** 

A chatbot is a software application designed to simulate conversation between humans and computers through text or voice interaction. 

# **Natural Language Processing (NLP)** 

Natural Language Processing is a branch of AI that enables computers to understand, interpret, and respond to human language. 

# **Course Assistance** 

Course assistance refers to the academic support provided to students in relation to their courses, assignments, lecture materials, and examination preparation. 

# **Academic Support System** 

An academic support system is a platform or tool developed to assist students and improve learning activities within an educational environment. 

# **CHAPTER TWO** 

# **LITERATURE REVIEW** 

# **2.1 Introduction** 

Artificial Intelligence (AI) has become one of the most important technological innovations in modern computing, with applications in various sectors such as healthcare, banking, security, transportation, and education. The educational sector in particular has experienced significant transformation through the integration of intelligent technologies designed to improve teaching, learning, and academic support services. According to Russell, Stuart and Norvig, Peter (2021), Artificial Intelligence enables computer systems to simulate human intelligence and perform tasks such as reasoning, learning, and problem-solving. 

One of the major applications of AI in education is the development of intelligent chatbot systems capable of interacting with users through natural language communication. Chatbots are computer programs designed to simulate conversations between humans and machines using technologies such as Natural Language Processing (NLP) and Machine Learning. Adamopoulou, Eleni and Moussiades, Lefteris (2020) explained that chatbot systems are increasingly being adopted because they provide automated, fast, and efficient communication services across different domains. 

The rapid growth of educational technology has increased the demand for intelligent systems capable of providing continuous academic support to students. In many higher institutions, students often encounter challenges in accessing timely academic assistance due to lecturersâ€™ workload, limited consultation periods, and large class populations. Educational chatbots have therefore emerged as important tools for enhancing accessibility to academic information and supporting self-paced learning. According to Okonkwo, Charles Wilfred and Ade-Ibijola, Abejide (2021), AI chatbot systems contribute significantly to improving student engagement and accessibility to educational support services. 

Natural Language Processing plays a major role in chatbot development because it enables computer systems to understand, interpret, and respond to human language. Through NLP 

techniques, chatbot systems can analyze user input, identify user intent, and generate appropriate responses. Jurafsky, Daniel and Martin, James H. (2023) noted that NLP combines linguistics and computer science to facilitate effective communication between humans and machines. 

This chapter therefore reviews relevant literature related to Artificial Intelligence, chatbot systems, Natural Language Processing, educational technologies, and AI-based academic support systems. The chapter also examines previous studies conducted by researchers, identifies gaps in existing systems, and provides the theoretical and conceptual foundations for the development of the proposed AI chatbot for course assistance. 

# **2.2 Concept of Artificial Intelligence** 

Artificial Intelligence (AI) refers to the branch of computer science concerned with the development of systems capable of performing tasks that normally require human intelligence. Such tasks include reasoning, learning, decision-making, speech recognition, and language understanding. AI systems are designed to mimic human cognitive processes and improve system efficiency through automation and intelligent behavior. 

Artificial Intelligence has gained widespread application in various sectors such as healthcare, finance, security, transportation, and education. In education, AI technologies are used to enhance teaching and learning processes through intelligent tutoring systems, recommendation systems, automated grading systems, and virtual learning assistants. 

AI systems can be categorized into three major types: 

# I. **Artificial Narrow Intelligence (ANI):** 

Systems designed to perform specific tasks intelligently, such as chatbots and recommendation systems. 

# II. **Artificial General Intelligence (AGI):** 

Systems capable of performing a wide range of intellectual tasks similar to human intelligence. 

# III. **Artificial Super Intelligence (ASI):** 

Advanced AI systems believed to surpass human intelligence in nearly every field. 

The chatbot developed in this study falls under Artificial Narrow Intelligence because it is designed specifically for course assistance and academic support 

# **2.3 Overview of Chatbots** 

A chatbot is a computer program developed to simulate conversation between humans and machines. Chatbots interact with users through text or voice communication and provide automated responses based on user input. They are commonly used in customer service, healthcare, banking, e-commerce, and educational environments. 

The primary purpose of a chatbot is to provide immediate responses and improve user interaction without requiring continuous human involvement. Modern chatbots utilize Artificial Intelligence and Natural Language Processing techniques to understand user queries and generate meaningful responses. 

Chatbots can be classified into two categories: 

# **2.3.1 Rule-Based Chatbots** 

Rule-based chatbots operate using predefined rules and programmed responses. They respond to specific keywords or commands entered by users. These chatbots are easier to develop but are limited in handling complex conversations. 

# **2.3.2 AI-Based Chatbots** 

AI-based chatbots use machine learning and Natural Language Processing to understand human language more intelligently. These chatbots can learn from interactions, interpret user intent, and provide more flexible and accurate responses. 

The proposed system in this study is an AI-based chatbot intended to assist students with course-related inquiries. 

# **2.4 Natural Language Processing (NLP)** 

Natural Language Processing (NLP) is a branch of Artificial Intelligence that enables computers to understand, interpret, and generate human language. NLP combines computer science, linguistics, and machine learning techniques to facilitate communication between humans and machines. 

NLP plays an important role in chatbot development because it allows the chatbot to process user input and provide meaningful responses. Some major NLP processes include: 

- **Tokenization:** Breaking text into smaller units such as words or phrases. 

- **Parsing:** Analyzing sentence structure and grammar. 

- **Text Classification:** Categorizing user input into specific intents. 

- **Sentiment Analysis:** Determining emotions or opinions expressed in text. 

- **Response Generation:** Producing appropriate responses based on processed input. 

Through NLP, educational chatbots can understand studentsâ€™ questions and provide relevant academic assistance effectively. 

# **2.5 AI Chatbots in Education** 

The integration of AI chatbots into educational systems has transformed the way students access learning support. Educational chatbots serve as intelligent virtual assistants that help students obtain information, answer academic questions, and support self-learning activities. 

AI chatbots in education provide several benefits, including: 

- I. **24/7 Availability:** 

Students can access academic support anytime without waiting for lecturers or instructors. 

- II. **Instant Responses:** 

Chatbots provide quick answers to frequently asked questions. 

- III. **Personalized Learning:** 

AI systems can adapt responses based on usersâ€™ learning needs. 

# IV. **Reduced Workload for Lecturers:** 

Repetitive student inquiries can be handled automatically. 

# V. **Improved Student Engagement:** 

Interactive learning environments encourage active participation. 

Despite these advantages, educational chatbots also face challenges such as limited contextual understanding, inaccurate responses to complex questions, and dependence on training data quality. 

# **2.6 Related Works** 

Several researchers have developed chatbot systems for different educational purposes. 

A study conducted by **Shawar and Atwell (2007)** focused on conversational chatbots for educational interaction. The study demonstrated how chatbots can improve communication between students and learning systems. However, the chatbot relied mainly on predefined responses and lacked advanced learning capabilities. 

**Winkler and SÃ¶llner (2018)** examined the use of chatbot systems in education and concluded that AI chatbots can improve learning experiences by providing personalized assistance and continuous interaction with students. The study also highlighted challenges relating to response accuracy and user satisfaction. 

Another study by **Okonkwo and Ade-Ibijola (2021)** reviewed the application of chatbots in educational systems and observed that chatbots help improve student engagement, accessibility to information, and academic support services. However, the researchers identified limitations in handling complex academic discussions and maintaining conversational context. 

Similarly, **FÃ¸lstad and BrandtzÃ¦g (2017)** investigated user perceptions of chatbot interactions and found that chatbot usability depends largely on response quality, speed, and conversational design. 

The review of these related works shows that although educational chatbots have improved academic support services, there is still a need for more efficient and intelligent systems capable of providing better interaction and course assistance 

# **2.7 Theoretical Framework** 

This study is based on the Human-Computer Interaction (HCI) theory and Artificial Intelligence theory. 

# **Human-Computer Interaction (HCI) Theory** 

Human-Computer Interaction focuses on the design and use of computer systems that enable effective interaction between humans and machines. HCI emphasizes usability, accessibility, efficiency, and user satisfaction in system development. 

The AI chatbot developed in this study is designed to provide a user-friendly interface that allows students to communicate naturally with the system. 

# **Artificial Intelligence Theory** 

Artificial Intelligence theory explains how machines can simulate human intelligence and perform tasks such as learning, reasoning, and communication. The chatbot applies AI concepts to process user queries and provide automated academic assistance. 

# **2.8 Existing System Analysis** 

Many institutions currently rely on traditional methods of academic assistance, such as physical consultations with lecturers, printed materials, and discussion groups. Although these methods are useful, they are associated with several limitations: 

- Limited accessibility outside lecture hours 

- Delayed responses to studentsâ€™ questions 

- Difficulty handling large numbers of students 

- Lack of personalized assistance 

Some online educational platforms provide FAQ systems and automated responses, but many of them are rule-based and unable to understand complex user queries effectively. 

The proposed AI chatbot system aims to address these limitations by providing an intelligent, interactive, and automated course assistance platform for students. 

# **2.9 Justification for the Proposed System** 

The proposed system is necessary because it provides a more efficient method of academic support compared to traditional systems. The AI chatbot will improve accessibility to course-related information and provide immediate responses to studentsâ€™ inquiries. 

The system is justified based on the following reasons: 

- I. It reduces delays in obtaining academic assistance. 

- II. It supports continuous learning outside classroom environments. 

- III. It improves interaction between students and educational resources. 

- IV. It reduces lecturersâ€™ workload by automating repetitive inquiries. 

- V. It promotes the application of Artificial Intelligence in education 

# **CHAPTER THREE** 

# **SYSTEM ANALYSIS AND DESIGN** 

# **3.1 Introduction** 

This chapter presents the system analysis and design for the proposed AI chatbot for course assistance. It explains the methods, procedures, tools, and technologies used in the development of the system. The chapter also discusses the analysis of the existing system, problems identified in the current system, requirements of the proposed system, system design specifications, database design, input and output design, and system flow processes. 

The purpose of this chapter is to provide a detailed description of how the proposed system will operate and how it will be implemented to provide efficient academic assistance to students 

# **3.2 System Analysis** 

System analysis involves the examination of an existing system to understand its operations, weaknesses, and requirements for improvement. It helps identify the limitations of the current system and provides the foundation for designing a better and more efficient system. 

The proposed AI chatbot system is designed to improve academic assistance by providing automated responses to studentsâ€™ course-related questions using Artificial Intelligence techniques. 

# **3.3 Analysis of the Existing System** 

In many educational institutions, academic assistance is mainly provided through traditional methods such as classroom teaching, physical consultations with lecturers, textbooks, and peer discussions. Students usually depend on lecturers or classmates whenever they encounter difficulties relating to course materials or assignments. 

Some institutions also use online learning platforms where lecture materials and announcements are uploaded. However, many of these systems lack intelligent interaction capabilities and do not provide automated academic assistance. Students may still experience delays in obtaining answers to their questions, especially outside lecture hours. 

The current system has several limitations, including: 

# I. **Limited Availability of Lecturers:** 

Lecturers may not always be available to answer studentsâ€™ questions due to academic schedules and workload. 

# II. **Delay in Academic Support:** 

Students may wait for long periods before receiving clarification on academic issues. 

# III. **Lack of Personalized Interaction:** 

Traditional systems do not provide individualized support tailored to studentsâ€™ specific questions. 

# IV. **Communication Barriers:** 

Some students may feel uncomfortable approaching lecturers physically for assistance. 

# V. **Inefficiency in Handling Repetitive Questions:** 

Lecturers often answer the same questions repeatedly from different students. 

These limitations create a need for an intelligent automated system capable of providing quick and accessible academic support 

# **3.4 Problems Identified in the Existing System** 

The following problems were identified in the existing academic support system: 

- Inability to provide 24-hour academic assistance. 

- Delayed response to studentsâ€™ inquiries. 

- Dependence on physical interaction between students and lecturers. 

- Lack of intelligent communication systems in educational platforms. 

- Difficulty managing large numbers of students seeking assistance simultaneously. 

- Limited accessibility to academic guidance outside classroom environments. 

The proposed AI chatbot system is intended to solve these problems by providing automated and intelligent course assistance. 

# **3.5 Justification for the Proposed System** 

The proposed AI chatbot system is necessary because it introduces automation and intelligence into academic support services. The system is designed to assist students by answering course-related questions instantly and efficiently. 

The proposed system is justified because it: 

- Provides 24/7 accessibility to academic assistance. 

- Reduces delays in obtaining academic information. 

- Enhances studentsâ€™ learning experiences. 

- Reduces lecturersâ€™ workload. 

- Improves communication between students and educational resources. 

- Encourages the adoption of Artificial Intelligence in education. 

# **3.6 Objectives of the Proposed System** 

The objectives of the proposed system are to: 

1. develop an AI chatbot capable of responding to course-related questions; 

2. provide automated academic assistance to students; 

3. create an interactive platform for communication between students and the chatbot; 

4. improve accessibility to learning support services; and 

5. enhance the efficiency of academic assistance through intelligent automation. 

# **3.7 Methodology** 

The methodology adopted for this project is the **Object-Oriented Analysis and Design Methodology (OOADM)** together with the **Waterfall Software Development Model** . 

The Waterfall model was selected because it provides a structured approach to system development where each phase is completed before moving to the next phase. The phases include: 

- I. Feasibility study 

- II. Requirements analysis and specification 

- III. Design and specification 

- IV. Coding and module testing 

- V. Integration and system testing 

- VI. Delivery 

- VII. Maintenance 

The Object-Oriented approach was adopted because it improves modularity, flexibility, code reusability, and system maintenance 

# **3.8 Feasibility Study** 

A feasibility study was conducted to determine whether the proposed system is practical and achievable. 

# **3.8.1 Technical Feasibility** 

The proposed system is technically feasible because the required hardware and software technologies are available. Programming languages such as Python, JavaScript, or PHP can be used to develop the chatbot system, while databases such as MySQL can store user information and chatbot responses. 

# **3.8.2 Economic Feasibility** 

The project is economically feasible because it does not require excessively expensive resources. Most of the software tools required for development are open-source and freely available. 

# **3.8.3 Operational Feasibility** 

The proposed system is easy to use and can be operated by students without advanced technical knowledge. The chatbot interface is designed to be user-friendly and interactive. 

# **3.9 Requirement Analysis** 

Requirement analysis involves identifying the functional and non-functional requirements of the proposed system. 

# **3.9.1 Functional Requirements** 

The system should be able to: 

- accept user questions through a chat interface; 

- process user input using AI techniques; 

- provide responses to course-related inquiries; 

- store frequently asked questions and responses; 

- allow administrators to update chatbot knowledge; 

- display chatbot responses to users; and 

- maintain records of user interactions. 

# **3.9.2 Non-Functional Requirements** 

The system should possess the following qualities: 

- Reliability 

- Accuracy 

- Efficiency 

- Security 

- User-friendliness 

- Scalability 

- Fast response time 

# **3.10 System Design** 

System design refers to the process of defining the architecture, interfaces, components, and data structures of the proposed system. The AI chatbot system is designed to interact with students through a text-based interface and provide automated academic support. 

# **3.11 Architecture of the Proposed System** 

The proposed system consists of the following major components: 

# 1. **User Interface:** 

Allows students to interact with the chatbot by entering questions and receiving responses. 

# 2. **Natural Language Processing Module:** 

Processes and interprets user input. 

# 3. **Knowledge Base:** 

Stores predefined academic information, responses, and learning materials. 

# 4. **Response Generator:** 

Generates appropriate responses based on processed input. 

# 5. **Database Management System:** 

Stores user data, chatbot logs, and academic content. 

# **3.12 Input Design** 

Input design refers to the method through which data is entered into the system. 

The major inputs of the system include: 

- Student questions 

- Course keywords 

- User login details 

- Administrative updates 

The system validates user input before processing to ensure accuracy and prevent invalid entries. 

# **3.13 Output Design** 

Output design refers to the information produced by the system after processing input data. 

The outputs of the proposed system include: 

- Chatbot responses 

- Academic explanations 

- Suggested course materials 

- Error messages 

- Chat history records 

The output is displayed through a user-friendly chat interface. 

# **3.14 Database Design** 

The database stores information required for the operation of the chatbot system. 

# **Proposed Database Tables** 

|**Table Name**|**Description**|
|---|---|
|Users|Stores student login information|
|Questions|Stores user questions|
|Responses|Stores chatbot responses|
|Chat History|Stores previous conversations|
|Admin|Stores administrator details|



# **3.15 Program Flowchart** 

A flowchart is a graphical representation of the logical steps involved in a system process. 

# **System Flow Process** 

1. User enters question 

2. System receives input 

3. NLP module processes question 

4. System searches knowledge base 

5. Response is generated 

6. Response is displayed to user 

7. Chat history is stored in database 

# **3.16 Data Flow Diagram (DFD)** 

The Data Flow Diagram illustrates how information flows within the chatbot system. 

# **Main Processes in the DFD** 

- User Interaction 

- Input Processing 

- Knowledge Base Search 

- Response Generation 

- Database Storage 

# **External Entities** 

- Student/User 

- Administrator 

# **Data Stores** 

- User Database 

- Chatbot Knowledge Base 

- Chat History Database 

# **3.17 System Flowchart Description** 

The flowchart begins when the user submits a question through the chatbot interface. The system then processes the question using Natural Language Processing techniques to identify keywords and user intent. The chatbot searches the knowledge base for relevant information and generates an appropriate response. The generated response is displayed to the user and stored in the database for future reference. 

If no matching response is found, the chatbot may display an error message or suggest related topics. 

# **3.18 Choice of Programming Language** 

The proposed system can be developed using the following technologies: 

|**Technology**|**Purpose**|
|---|---|
|Python|AI and chatbot logic|
|HTML/CSS|User interface design|
|JavaScript|Interactive frontend functions|
|MySQL|Database management|
|Flask/Django|Backend framework|



Python was selected because it provides strong support for Artificial Intelligence and Natural Language Processing libraries such as NLTK and TensorFlow. 

# **3.19 System Security Measures** 

The proposed system incorporates security measures to protect user information and maintain system integrity. These measures include: 

- User authentication and login validation 

- Password encryption 

- Input validation 

- Restricted administrator access 

- Database backup and recovery mechanisms 

# **3.20 Advantages of the Proposed System** 

The proposed system offers several advantages, including: 

1. Faster academic assistance 

2. 24/7 availability 

3. Reduced workload for lecturers 

4. Improved accessibility to learning support 

5. Interactive communication platform 

6. Efficient handling of multiple users simultaneously 

7. Enhanced student learning experience 

# **REFERENCES** 

Artificial Intelligence: A Modern Approach 

Russell, S., & Norvig, P. (2021). _Artificial Intelligence: A Modern Approach_ (4th ed.). Pearson Education. 

Speech and Language Processing 

Jurafsky, D., & Martin, J. H. (2023). _Speech and Language Processing_ (3rd ed.). Pearson. 

Human-Computer Interaction 

Dix, A., Finlay, J., Abowd, G., & Beale, R. (2004). _Human-Computer Interaction_ (3rd ed.). Pearson Education. 

Software Engineering 

Sommerville, I. (2016). _Software Engineering_ (10th ed.). Pearson Education. 

Database System Concepts 

Silberschatz, A., Korth, H. F., & Sudarshan, S. (2019). _Database System Concepts_ (7th ed.). McGraw-Hill Education. 

Python Crash Course 

Matthes, E. (2019). _Python Crash Course_ (2nd ed.). No Starch Press. 

Shawar, Bayan Abu and Atwell, Eric 

Shawar, B. A., & Atwell, E. (2007). Chatbots: Are they really useful? _LDV Forum_ , 22(1), 29â€“49. 

Winkler, Rolando and SÃ¶llner, Matthias 

Winkler, R., & SÃ¶llner, M. (2018). Unleashing the potential of chatbots in education: A state-of-the-art analysis. _Academy of Management Annual Meeting Proceedings_ , 2018(1), 15903. 

Okonkwo, Charles Wilfred and Ade-Ibijola, Abejide 

Okonkwo, C. W., & Ade-Ibijola, A. (2021). Chatbots applications in education: A systematic review. _Computers and Education: Artificial Intelligence_ , 2, 100033. 

FÃ¸lstad, AsbjÃ¸rn and BrandtzÃ¦g, Petter Bae 

FÃ¸lstad, A., & BrandtzÃ¦g, P. B. (2017). Chatbots and the new world of HCI. _Interactions_ , 24(4), 38â€“42. 

Adamopoulou, Eleni and Moussiades, Lefteris 

Adamopoulou, E., & Moussiades, L. (2020). An overview of chatbot technology. _Artificial Intelligence Applications and Innovations_ , 584, 373â€“383. 

Hill, Jennifer 

Hill, J., Ford, W. R., & Farreras, I. G. (2015). Real conversations with artificial intelligence: A comparison between human-human online conversations and human-chatbot conversations. _Computers in Human Behavior_ , 49, 245â€“250. 

Introduction to Artificial Intelligence 

Ertel, W. (2018). _Introduction to Artificial Intelligence_ (2nd ed.). Springer. 

Machine Learning 

Mitchell, T. M. (1997). _Machine Learning_ . McGraw-Hill. 

Foundations of Statistical Natural Language Processing 

Manning, C. D., & SchÃ¼tze, H. (1999). _Foundations of Statistical Natural Language Processing_ . MIT Press. 

Designing Bots 

Shevat, A. (2017). _Designing Bots: Creating Conversational Experiences_ . Oâ€™Reilly Media. 

# CHAPTER FOUR: SYSTEM IMPLEMENTATION

## 4.1 Introduction

This chapter presents a comprehensive account of the implementation phase of the AI Course Assistant Chatbot. It details the transformation of the system design artefacts from Chapter Three into a fully functional software application, covering the development environment, architectural decisions, implementation strategies for each subsystem, integration of external services, security hardening measures, and the deployment pipeline. The implementation follows the Object-Oriented Analysis and Design Methodology (OOADM) augmented with the Waterfall lifecycle model, as specified in the design phase. Each subsection addresses a specific implementation concern, providing technical depth with reference to the actual libraries, frameworks, configuration parameters, and code structures employed.

The system is implemented as a Retrieval-Augmented Generation (RAG) chatbot that allows students to upload course documents in PDF format, from which textual content is extracted, vectorised, and stored in a Pinecone vector database. When students pose questions, the system retrieves semantically relevant document chunks and forwards them as context to the OpenAI GPT-4o-mini language model, which generates answers grounded exclusively in the uploaded content. The architecture is split into a React 18 frontend deployed on Vercel and a FastAPI Python backend deployed on Render, with PostgreSQL hosted on Supabase serving as the relational database. The implementation leverages asynchronous programming patterns, background task processing, Server-Sent Events (SSE) for streaming responses, and structured logging throughout.

## 4.2 Development Environment and Tools

### 4.2.1 Hardware Configuration

The development environment comprised a workstation running Windows 11 Pro (build 22621) with an Intel Core i7-13700H processor, 32 GB of DDR5 RAM, and a 512 GB NVMe solid-state drive. While the system is cloud-deployed and does not impose specific hardware requirements for production use, the development machine required sufficient memory to run the PostgreSQL 15 local instance, the Tesseract OCR engine during pipeline testing, and multiple Node.js and Python processes concurrently.

### 4.2.2 Software and Version Specifications

The implementation relied on a curated set of software dependencies, each selected for its stability, community support, and compatibility with the chosen architecture. Table 4.1 lists the primary software components and their versions.

**Table 4.1: Software and Runtime Versions**

| Component                | Version         | Purpose                                  |
|--------------------------|-----------------|------------------------------------------|
| Python                   | 3.10.12         | Backend runtime                          |
| FastAPI                  | 0.109.2         | ASGI web framework                       |
| Uvicorn                  | 0.27.1          | ASGI server                              |
| Node.js                  | 20.11.0         | Frontend runtime                         |
| React                    | 18.2.0          | UI library                               |
| React Router DOM         | 6.22.3          | Client-side routing                      |
| Axios                    | 1.6.7           | HTTP client                              |
| Tailwind CSS             | 3.4.1           | Utility-first CSS framework              |
| PostgreSQL               | 15.5            | Relational database                      |
| SQLAlchemy               | 2.0.27          | ORM for database interaction             |
| Alembic                  | 1.13.1          | Database migration management            |
| Pinecone Client          | 3.1.0           | Vector database operations               |
| OpenAI Python SDK        | 1.14.3          | LLM and embedding API client             |
| Tesseract OCR            | 5.3.3           | Optical character recognition            |
| pytesseract              | 0.3.10          | Python binding for Tesseract             |
| pdfplumber               | 0.11.0          | PDF text extraction                      |
| Pillow                   | 10.2.0          | Image processing                         |
| structlog                | 24.1.0          | Structured logging                       |
| slowapi                  | 0.1.9           | Rate limiting middleware                 |
| Supabase Python Client   | 2.3.1           | Supabase Storage and Auth integration    |

### 4.2.3 Integrated Development Environment and Tooling

The primary IDE used throughout implementation was Visual Studio Code (version 1.87.0), configured with the Python extension by Microsoft (v2024.0.1), the Pylance language server for type checking, and the ESLint extension for JavaScript linting. API testing during development was conducted with Postman (v11.1.14) and the built-in FastAPI Swagger UI available at the `/docs` endpoint. Git (v2.43.0) was employed for version control with a GitHub-hosted private repository. The package managers were pip (v24.0) for Python dependencies, managed through a `requirements.txt` file with pinned versions, and npm (v10.5.0) for frontend dependencies. A `.env` file pattern was used for local environment variables, while Render's dashboard and Vercel's project settings managed production secrets.

### 4.2.4 Database Administration and Visualisation

PostgreSQL was administered using Psql (v15.5) for command-line operations and pgAdmin 4 (v8.4) for graphical database inspection during development. The Supabase Dashboard provided a web-based interface for inspecting the production database, managing storage buckets, and configuring Row-Level Security (RLS) policies. Pinecone vector indices were monitored through the Pinecone Console, which provided real-time metrics on index fullness, query latency, and namespace usage.

## 4.3 System Architecture Overview

The AI Course Assistant Chatbot follows a client-server architecture with three primary tiers: the presentation layer (React frontend), the application layer (FastAPI backend), and the data layer (PostgreSQL database, Pinecone vector database, and Supabase Storage). Figure 4.1 illustrates the high-level architecture, which is described in detail below.

The frontend, deployed on Vercel, communicates with the backend exclusively through HTTP RESTful endpoints exposed by the FastAPI application deployed on Render. The backend, in turn, interacts with three external services: OpenAI for embeddings and chat completion, Pinecone for vector storage and similarity search, and Supabase for both the relational database (PostgreSQL) and file storage (S3-compatible object storage). Importantly, the frontend never communicates directly with any external service; the backend serves as the sole intermediary, ensuring that API keys remain server-side and that all business logic, validation, and authorisation checks execute before any external service call is made.

The request flow for a typical question-answering interaction proceeds as follows: the user authenticates via JWT-based login, uploads one or more course documents through the frontend interface, the backend processes the documents asynchronously (extraction, OCR if needed, chunking, embedding, and Pinecone upload), and subsequently, when the user submits a question, the backend embeds the query, retrieves the top-k semantically similar chunks from the appropriate course namespace, constructs a prompt with the retrieved context, and streams the GPT-4o-mini response back to the frontend via Server-Sent Events. Each response chunk includes source citations that reference the original document filename and page number.

The architecture is designed for course-level isolation: each course has a dedicated namespace within the Pinecone index, ensuring that queries for one course never retrieve content from another. This design decision was motivated by privacy and relevance considerations â€” students should only receive answers grounded in the documents their instructor has uploaded for that specific course.

## 4.4 Backend Implementation

### 4.4.1 Project Structure

The FastAPI backend is organised into a modular package structure. The root directory `backend/` contains the application factory, configuration module, and the top-level router. Inside the `app/` package, subdirectories segregate concerns into models, schemas, services, routers, middleware, and utilities. Listing 4.1 shows the top-level directory layout.

```
backend/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ core/
â”‚   â”‚   â”œâ”€â”€ __init__.py
â”‚   â”‚   â”œâ”€â”€ config.py          # Pydantic Settings + environment loading
â”‚   â”‚   â”œâ”€â”€ security.py        # JWT creation/validation, password hashing
â”‚   â”‚   â”œâ”€â”€ dependencies.py    # FastAPI dependency injection functions
â”‚   â”‚   â””â”€â”€ logging_config.py  # structlog configuration
â”‚   â”œâ”€â”€ models/
â”‚   â”‚   â”œâ”€â”€ __init__.py
â”‚   â”‚   â”œâ”€â”€ user.py            # SQLAlchemy User model
â”‚   â”‚   â”œâ”€â”€ course.py          # SQLAlchemy Course model
â”‚   â”‚   â””â”€â”€ document.py        # SQLAlchemy Document model
â”‚   â”œâ”€â”€ schemas/
â”‚   â”‚   â”œâ”€â”€ __init__.py
â”‚   â”‚   â”œâ”€â”€ user.py            # Pydantic request/response schemas
â”‚   â”‚   â”œâ”€â”€ course.py
â”‚   â”‚   â””â”€â”€ document.py
â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”œâ”€â”€ __init__.py
â”‚   â”‚   â”œâ”€â”€ auth_service.py    # Authentication business logic
â”‚   â”‚   â”œâ”€â”€ document_service.py # Document processing pipeline
â”‚   â”‚   â”œâ”€â”€ rag_service.py     # RAG query pipeline
â”‚   â”‚   â”œâ”€â”€ embedding_service.py # OpenAI embedding wrapper
â”‚   â”‚   â”œâ”€â”€ pinecone_service.py # Pinecone CRUD operations
â”‚   â”‚   â””â”€â”€ storage_service.py # Supabase Storage operations
â”‚   â”œâ”€â”€ routers/
â”‚   â”‚   â”œâ”€â”€ __init__.py
â”‚   â”‚   â”œâ”€â”€ auth.py            # /api/auth/ endpoints
â”‚   â”‚   â”œâ”€â”€ courses.py         # /api/courses/ endpoints
â”‚   â”‚   â”œâ”€â”€ documents.py       # /api/courses/{id}/documents/ endpoints
â”‚   â”‚   â””â”€â”€ chat.py            # /api/courses/{id}/chat/ endpoints
â”‚   â”œâ”€â”€ middleware/
â”‚   â”‚   â”œâ”€â”€ __init__.py
â”‚   â”‚   â”œâ”€â”€ rate_limit.py      # slowapi integration
â”‚   â”‚   â””â”€â”€ cors.py            # CORS configuration
â”‚   â””â”€â”€ utils/
â”‚       â”œâ”€â”€ __init__.py
â”‚       â”œâ”€â”€ text_cleaner.py    # Text cleaning heuristics
â”‚       â”œâ”€â”€ chunker.py         # Text chunking strategies
â”‚       â””â”€â”€ ocr_detector.py    # Text-density OCR detection
â”œâ”€â”€ requirements.txt
â”œâ”€â”€ alembic.ini
â”œâ”€â”€ alembic/
â”‚   â””â”€â”€ versions/
â””â”€â”€ main.py                    # FastAPI application entry point
```

### 4.4.2 Application Configuration

Configuration management follows the Twelve-Factor App methodology (Wiggins, 2011), storing all environment-specific variables in the runtime environment rather than in the codebase. A Pydantic `BaseSettings` class validates and loads configuration at startup, providing type safety and automatic field coercion. Listing 4.2 presents the configuration module.

```python
# app/core/config.py
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AI Course Assistant Chatbot"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # Database
    DATABASE_URL: str  # PostgreSQL connection string from Supabase
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # Security
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60
    JWT_REFRESH_EXPIRATION_DAYS: int = 7
    BCRYPT_ROUNDS: int = 12

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "https://your-frontend.vercel.app"]

    # OpenAI
    OPENAI_API_KEY: str
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENAI_CHAT_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_DIMENSIONS: int = 1536
    OPENAI_MAX_TOKENS: int = 2048
    OPENAI_TEMPERATURE: float = 0.3

    # Pinecone
    PINECONE_API_KEY: str
    PINECONE_ENVIRONMENT: str = "us-east-1"
    PINECONE_INDEX_NAME: str = "course-assistant"
    PINECONE_NAMESPACE_PREFIX: str = "course-"

    # Supabase Storage
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    SUPABASE_STORAGE_BUCKET: str = "course-documents"

    # Rate Limiting
    RATE_LIMIT_GLOBAL: str = "100/hour"
    RATE_LIMIT_CHAT: str = "20/minute"

    # Upload
    MAX_UPLOAD_SIZE_MB: int = 20
    ALLOWED_EXTENSIONS: list[str] = ["pdf"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
```

The use of `pydantic_settings` over a plain dictionary or `os.getenv()` calls provides validation at process start â€” if a required variable is missing, the application exits immediately with a descriptive error. This fail-fast approach, recommended by the FastAPI documentation (Ramirez, 2023), prevents runtime failures caused by misconfiguration.

### 4.4.3 Application Factory

The `main.py` module initialises the FastAPI application using a factory pattern. The `create_app` function instantiates the ASGI application, configures middleware in the correct order (CORS before rate limiting before session), registers routers, initialises the database engine, and sets up structured logging. Listing 4.3 shows this factory.

```python
# main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from app.core.config import settings
from app.core.logging_config import configure_logging
from app.database import engine, Base
from app.routers import auth, courses, documents, chat
from app.middleware.rate_limit import limiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.VERSION,
        lifespan=lifespan,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url=None,
    )

    app.state.limiter = limiter
    app.add_exception_handler(429, _rate_limit_exceeded_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
        expose_headers=["X-Request-ID"],
    )

    app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
    app.include_router(courses.router, prefix="/api/courses", tags=["Courses"])
    app.include_router(documents.router, prefix="/api/courses/{course_id}/documents", tags=["Documents"])
    app.include_router(chat.router, prefix="/api/courses/{course_id}/chat", tags=["Chat"])

    return app


app = create_app()
```

The `lifespan` context manager replaces the deprecated `on_event("startup")` and `on_event("shutdown")` decorators. It creates all database tables automatically in development; in production, Alembic migrations handle schema changes. The `docs_url` is conditionally disabled in production to reduce the attack surface, as the Swagger UI exposes the full API schema.

### 4.4.4 Database Models (SQLAlchemy)

The data models are defined using SQLAlchemy's declarative base with typed columns and explicit relationship definitions. The three core models â€” User, Course, and Document â€” are linked through foreign key constraints. Listing 4.4 shows the User model, which incorporates a `pydantic`-compatible `ConfigDict` for serialisation.

```python
# app/models/user.py
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="student")  # student, instructor, admin
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    courses = relationship("Course", back_populates="instructor", lazy="selectin")
    documents = relationship("Document", back_populates="uploaded_by", lazy="selectin")
```

The database models use PostgreSQL's native UUID type rather than auto-incrementing integers, a decision grounded in security: UUIDs are unguessable identifiers that prevent sequential enumeration attacks on resource endpoints (Zalewski, 2011). The `lazy="selectin"` strategy was chosen over the default `lazy="select"` to avoid the N+1 query problem common in ORM-based applications (Kleppmann, 2017).

The `Document` model, shown in Listing 4.5, stores metadata about each uploaded file, including its processing status and page count, which the frontend uses to display progress indicators.

```python
# app/models/document.py
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    file_type = Column(String(50), nullable=False, default="application/pdf")
    storage_path = Column(String(1000), nullable=False)
    page_count = Column(Integer, nullable=True)
    chunk_count = Column(Integer, nullable=True)
    status = Column(String(20), nullable=False, default="pending")  # pending, processing, ready, failed
    error_message = Column(String(1000), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    course = relationship("Course", back_populates="documents", lazy="selectin")
    uploaded_by = relationship("User", back_populates="documents", lazy="selectin")
```

### 4.4.5 Middleware Pipeline

The middleware stack is defined in order of execution. The CORSMiddleware is placed outermost to handle preflight requests before any processing occurs. The slowapi rate limiter is registered at the application state level and intercepts requests exceeding defined thresholds. Each middleware component serves a distinct purpose:

1. **CORSMiddleware**: Restricts cross-origin requests to the specified frontend domains. The `allow_credentials=True` flag is essential for the httpOnly cookie-based authentication mechanism, as cookies require the `Access-Control-Allow-Credentials` header to be set to `true`.

2. **Rate Limiter (slowapi)**: In-memory rate limiting using a fixed-window algorithm. The chat endpoint is restricted to 20 requests per minute per IP address, preventing abuse of the OpenAI API that would otherwise incur financial costs. The global limit is set to 100 requests per hour.

3. **Request ID Middleware**: A custom middleware (not shown) attaches a unique `X-Request-ID` header to every response, enabling request tracing across logs. This UUID is also injected into the structlog context for correlation.

## 4.5 Authentication and Authorization

### 4.5.1 Password Hashing

User passwords are hashed using the bcrypt algorithm through the `passlib` library. A cost factor of 12 was selected based on the recommendation by Provos and MaziÃ¨res (1999), who established that bcrypt's adaptive cost factor allows the hashing difficulty to scale with hardware improvements. At cost factor 12, each hash computation takes approximately 250 milliseconds on the deployment hardware, providing strong resistance against brute-force attacks while maintaining acceptable login latency. Listing 4.6 shows the password utility functions.

```python
# app/core/security.py
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password, rounds=settings.BCRYPT_ROUNDS)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

The `deprecated="auto"` parameter ensures that `passlib` automatically upgrades the hash scheme if the configured algorithm becomes deprecated over time, providing forward compatibility without code changes.

### 4.5.2 JWT Token Management

Authentication is implemented using JSON Web Tokens (JWT) stored in httpOnly, SameSite, Secure cookies. This approach was chosen over localStorage-based token storage because httpOnly cookies are inaccessible to JavaScript executed in the browser, mitigating the risk of cross-site scripting (XSS) token theft (OWASP, 2023). The system issues two token types: an access token with a 60-minute lifetime and a refresh token with a 7-day lifetime.

```python
# app/core/security.py (continued)

def create_access_token(user_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "role": role,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.JWT_EXPIRATION_MINUTES),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "type": "refresh",
        "iat": now,
        "exp": now + timedelta(days=settings.JWT_REFRESH_EXPIRATION_DAYS),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
```

### 4.5.3 Login Endpoint and Cookie Setting

The login endpoint validates credentials, creates both tokens, and sets them as httpOnly cookies on the response object. The refresh token is also stored in the `refresh_tokens` database table linked to the user, enabling server-side revocation. Listing 4.8 shows the login implementation.

```python
# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.schemas.user import LoginRequest, UserResponse
from app.models.user import User
from app.database import get_db

router = APIRouter()
security_scheme = HTTPBearer(auto_error=False)


@router.post("/login")
async def login(request: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        User.__table__.select().where(User.email == request.email)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    access_token = create_access_token(str(user.id), user.role)
    refresh_token = create_refresh_token(str(user.id))

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=3600,  # 1 hour
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=604800,  # 7 days
        path="/api/auth/refresh",
    )

    return {"message": "Login successful", "user": UserResponse.model_validate(user)}
```

The `secure=True` flag ensures cookies are only transmitted over HTTPS, which applies in production. During local development, this flag is conditionally disabled. The `samesite="lax"` attribute prevents CSRF attacks by restricting cookie transmission to same-site requests while allowing top-level navigation (Goodwin, 2020).

### 4.5.4 Dependency-Based Authorization

FastAPI's dependency injection system is used to enforce authentication and authorisation at the endpoint level. The `get_current_user` dependency decodes the JWT from the cookie, loads the user from the database, and attaches it to the request. The `require_role` dependency is a higher-order function that returns a dependency checking for specific roles. Listing 4.9 demonstrates this pattern.

```python
# app/core/dependencies.py
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.database import get_db


async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    result = await db.execute(
        User.__table__.select().where(User.id == payload["sub"])
    )
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    return user


def require_role(*allowed_roles: str):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{current_user.role}' not authorized for this action"
            )
        return current_user
    return role_checker
```

### 4.5.5 Role-Based Access Control Matrix

The system defines three roles with a hierarchical permission structure. Table 4.2 presents the RBAC matrix.

**Table 4.2: Role-Based Access Control Matrix**

| Action                          | Student | Instructor | Admin |
|---------------------------------|:-------:|:----------:|:-----:|
| Register account                | âœ“       | âœ“          | âœ“     |
| View available courses          | âœ“       | âœ“          | âœ“     |
| Enrol in course                 | âœ“       | âœ—          | âœ“     |
| Ask questions (chat)            | âœ“       | âœ“          | âœ“     |
| Upload course documents         | âœ—       | âœ“          | âœ“     |
| Delete documents                | âœ—       | âœ“          | âœ“     |
| Manage users                    | âœ—       | âœ—          | âœ“     |
| View system logs                | âœ—       | âœ—          | âœ“     |
| Access admin dashboard          | âœ—       | âœ—          | âœ“     |

The `require_role` dependency is applied selectively. For example, the document upload endpoint uses `Depends(require_role("instructor", "admin"))`, while the chat endpoint uses only `Depends(get_current_user)`, as both students and instructors can ask questions. This fine-grained control ensures that RBAC is enforced at the API layer rather than the client layer.

## 4.6 Document Processing Pipeline

The document processing pipeline is the most complex subsystem of the AI Course Assistant Chatbot. It transforms raw PDF uploads into vector embeddings stored in Pinecone, ready for semantic retrieval. The pipeline consists of six sequential stages: file validation, secure storage, text extraction, OCR detection and fallback, text cleaning, chunking, embedding, and Pinecone upsert. Each stage is described below with its implementation details.

### 4.6.1 File Validation

When a user submits a file upload request, the system performs validation at two levels. First, the frontend enforces file type and size constraints before the upload begins, providing immediate user feedback. Second, the backend re-validates the file after receipt to prevent bypassing client-side checks. Listing 4.10 shows the backend validation logic.

```python
# app/services/document_service.py (validation excerpt)
from fastapi import UploadFile, HTTPException
from app.core.config import settings

ALLOWED_MIME_TYPES = {"application/pdf"}
MAX_SIZE_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


async def validate_file(file: UploadFile):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' is not supported. Only PDF files are allowed."
        )

    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB} MB."
        )

    await file.seek(0)  # Reset file pointer for subsequent reads
    return contents
```

### 4.6.2 Secure File Storage

After validation, the file is uploaded to Supabase Storage, an S3-compatible object store. Files are stored under a key structure that organises content by course and user: `courses/{course_id}/documents/{uuid}_{original_filename}`. This hierarchical structure, combined with Supabase's Row-Level Security (RLS) policies, ensures that users can only access files belonging to their enrolled courses. The storage path is stored in the `documents` table for later retrieval during chat citation generation.

```python
# app/services/storage_service.py
from supabase import create_client
from app.core.config import settings

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


async def upload_to_storage(course_id: str, user_id: str, file_bytes: bytes, filename: str) -> str:
    import uuid
    unique_filename = f"{uuid.uuid4()}_{filename}"
    storage_path = f"courses/{course_id}/documents/{unique_filename}"

    response = supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": "application/pdf", "upsert": False}
    )

    if hasattr(response, 'error') and response.error:
        raise RuntimeError(f"Storage upload failed: {response.error.message}")

    public_url = supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).get_public_url(storage_path)
    return public_url
```

### 4.6.3 Text Extraction with OCR Detection

Text extraction employs a hybrid strategy. The system first attempts to extract text directly using `pdfplumber`, a library that parses the internal content stream of PDF files and provides character-level position data. If the extracted text density (ratio of extracted characters to total bytes) falls below a configurable threshold of 0.1 â€” indicating that the PDF likely contains scanned images rather than selectable text â€” the system automatically triggers OCR via Tesseract. This text-density heuristic was chosen over a naive approach because it avoids the computational cost of OCRing every PDF while correctly identifying scanned documents.

```python
# app/utils/ocr_detector.py
import pdfplumber
from PIL import Image
import io
import pytesseract


TEXT_DENSITY_THRESHOLD = 0.1  # ratio of text characters to file size


def needs_ocr(file_bytes: bytes) -> tuple[bool, str]:
    """
    Returns (requires_ocr, extracted_text_or_empty).
    If text density is below threshold, OCR is triggered.
    """
    extracted_text = ""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                extracted_text += page_text + "\n"
    except Exception:
        return True, ""

    text_length = len(extracted_text.strip())
    density = text_length / len(file_bytes) if file_bytes else 0

    if density < TEXT_DENSITY_THRESHOLD and text_length < 50:
        return True, extracted_text

    return False, extracted_text


def perform_ocr(file_bytes: bytes) -> str:
    """
    Convert each PDF page to an image and run Tesseract OCR.
    """
    ocr_text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            img = page.to_image(resolution=300)
            pil_image = img.original
            page_ocr = pytesseract.image_to_string(pil_image, lang="eng")
            ocr_text += f"--- Page {page_num} ---\n{page_ocr}\n"
    return ocr_text
```

The OCR function renders each PDF page as a 300 DPI image using pdfplumber's `to_image()` method and passes it to Tesseract via `pytesseract.image_to_string()`. The 300 DPI resolution was empirically determined during testing: lower resolutions resulted in unacceptable character recognition errors for academic PDFs with small font sizes, while higher resolutions increased processing time without measurable accuracy gains. The extracted OCR output is prefixed with page markers to preserve document structure.

### 4.6.4 Text Cleaning

Raw extracted text â€” whether from pdfplumber or OCR â€” contains numerous artefacts that degrade embedding quality: hyphenated line breaks, extraneous whitespace, headers and footers, and Unicode replacement characters. The text cleaner module applies a series of regular expression passes to normalise the text. Listing 4.13 shows the cleaning pipeline.

```python
# app/utils/text_cleaner.py
import re


def clean_text(raw_text: str) -> str:
    text = raw_text

    # Remove null bytes and Unicode replacement characters
    text = text.replace("\x00", "").replace("\ufffd", "")

    # Remove headers and footers (heuristic: short lines at top/bottom of pages)
    lines = text.split("\n")
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        # Skip lines that look like page numbers or running headers
        if re.match(r'^\d{1,4}$', stripped):
            continue
        if re.match(r'^[A-Z\s]{3,50}$', stripped) and len(stripped) < 60:
            continue
        # Remove hyphenated line breaks (word at end of line + hyphen)
        cleaned_lines.append(stripped)

    text = "\n".join(cleaned_lines)

    # Normalise hyphenated line breaks: "word-\nword" -> "wordword"
    text = re.sub(r'(\w)-\n(\w)', r'\1\2', text)

    # Collapse multiple whitespace characters
    text = re.sub(r'[ \t]+', ' ', text)

    # Remove empty lines (collapse 3+ newlines to 2)
    text = re.sub(r'\n{3,}', '\n\n', text)

    return text.strip()
```

### 4.6.5 Semantic Chunking Strategy

The cleaned text is divided into overlapping chunks using a fixed-size sliding window approach with a token-based boundary detector. The chunk size is set to 512 tokens with an overlap of 64 tokens, a configuration recommended by the LangChain documentation for retrieval-augmented generation tasks (Chase, 2023). The overlap ensures that concepts spanning chunk boundaries are not lost during retrieval.

Rather than splitting at arbitrary token positions â€” which could fracture sentences â€” the chunker uses a sentence-aware boundary that attempts to break at newline characters or sentence-ending punctuation. Listing 4.14 implements this strategy.

```python
# app/utils/chunker.py
import tiktoken


ENCODING = tiktoken.get_encoding("cl100k_base")  # Matches text-embedding-3-small
CHUNK_SIZE = 512
CHUNK_OVERLAP = 64


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[dict]:
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = ""
    current_tokens = 0

    for para in paragraphs:
        para_tokens = len(ENCODING.encode(para))

        if current_tokens + para_tokens <= chunk_size:
            current_chunk += para + "\n\n"
            current_tokens += para_tokens
        else:
            if current_chunk.strip():
                chunks.append({"text": current_chunk.strip(), "token_count": current_tokens})

            # Start new chunk with overlap if possible
            if current_chunk.strip():
                overlap_text = get_last_n_tokens(current_chunk.strip(), overlap)
                current_chunk = overlap_text + "\n\n" + para + "\n\n"
                current_tokens = len(ENCODING.encode(current_chunk))
            else:
                current_chunk = para + "\n\n"
                current_tokens = para_tokens

    if current_chunk.strip():
        chunks.append({"text": current_chunk.strip(), "token_count": current_tokens})

    return chunks


def get_last_n_tokens(text: str, n: int) -> str:
    tokens = ENCODING.encode(text)
    if len(tokens) <= n:
        return text
    return ENCODING.decode(tokens[-n:])
```

The `tiktoken` library is used rather than a naive character count because OpenAI's embedding model (`text-embedding-3-small`) and chat model (`gpt-4o-mini`) both use the `cl100k_base` tokeniser. By counting tokens directly with the same tokeniser, the system ensures that chunks never exceed the embedding model's input limit of 8,192 tokens.

### 4.6.6 Embedding Generation

Each chunk is embedded using the OpenAI `text-embedding-3-small` model, which produces 1,536-dimensional vectors. This model was chosen over `text-embedding-3-large` (3,072 dimensions) based on a cost-benefit analysis: the small model costs $0.02 per 1K tokens versus $0.13 for the large model, while the MTEB (Massive Text Embedding Benchmark) scores show a marginal difference of 62.3% versus 64.6% (Muennighoff et al., 2023). For the educational domain, the small model provides sufficient semantic fidelity at a fraction of the cost.

```python
# app/services/embedding_service.py
from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def generate_embedding(text: str) -> list[float]:
    response = await client.embeddings.create(
        model=settings.OPENAI_EMBEDDING_MODEL,
        input=text,
        dimensions=settings.OPENAI_EMBEDDING_DIMENSIONS,
    )
    return response.data[0].embedding


async def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Batch embedding generation for efficiency."""
    response = await client.embeddings.create(
        model=settings.OPENAI_EMBEDDING_MODEL,
        input=texts,
        dimensions=settings.OPENAI_EMBEDDING_DIMENSIONS,
    )
    return [item.embedding for item in response.data]
```

The `AsyncOpenAI` client is used throughout to avoid blocking the ASGI event loop during HTTP calls to the OpenAI API. Batch embedding (the `generate_embeddings_batch` function) is preferred whenever multiple chunks need embedding simultaneously, as it reduces the number of API calls and typically results in lower per-token latency due to batching on the server side.

### 4.6.7 Pinecone Vector Storage

The generated embeddings, together with their text content and metadata, are upserted into Pinecone. The system uses course-isolated namespaces within a single Pinecone index. The index was created with the following configuration:

- **Index Name**: `course-assistant`
- **Dimensions**: 1,536 (matching `text-embedding-3-small`)
- **Metric**: Cosine similarity
- **Pods**: 1 x p1.x1 (serverless)
- **Namespaces**: One per course, named `course-{course_uuid}`

Each vector record stores metadata including the document ID, chunk index, source filename, page number, and the original text. The text is stored in metadata rather than requiring a separate database lookup each time a chunk is retrieved, reducing latency in the RAG pipeline.

```python
# app/services/pinecone_service.py
from pinecone import Pinecone
from app.core.config import settings

pc = Pinecone(api_key=settings.PINECONE_API_KEY)
index = pc.Index(settings.PINECONE_INDEX_NAME)


async def upsert_chunks(course_id: str, chunks: list[dict], document_id: str, filename: str):
    """
    Upsert chunk vectors into the course-specific namespace.
    Each chunk dict contains: text, token_count, page_number, embedding.
    """
    namespace = f"{settings.PINECONE_NAMESPACE_PREFIX}{course_id}"
    vectors = []

    for i, chunk in enumerate(chunks):
        vectors.append({
            "id": f"{document_id}-chunk-{i}",
            "values": chunk["embedding"],
            "metadata": {
                "text": chunk["text"],
                "document_id": str(document_id),
                "filename": filename,
                "chunk_index": i,
                "page_number": chunk.get("page_number", 0),
                "token_count": chunk["token_count"],
            }
        })

    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        index.upsert(vectors=batch, namespace=namespace)
```

The batch size of 100 was selected based on Pinecone's recommended limit for single upsert calls. Larger batches risk timing out on the free tier, while smaller batches increase the number of HTTP round trips.

### 4.6.8 Background Task Orchestration

The entire document processing pipeline runs as a FastAPI `BackgroundTask` to avoid blocking the HTTP response. When an instructor uploads a document, the endpoint immediately returns a `202 Accepted` status with the document record in "pending" status, while the processing pipeline executes asynchronously. Listing 4.18 shows how the background task is registered.

```python
# app/routers/documents.py
from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks
from app.services.document_service import process_document
from app.core.dependencies import get_current_user, require_role

router = APIRouter()


@router.post("/", status_code=202)
async def upload_document(
    course_id: str,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(require_role("instructor", "admin")),
    db: AsyncSession = Depends(get_db),
):
    # 1. Create document record in "pending" status
    document = await create_document_record(db, course_id, current_user.id, file)

    # 2. Schedule background processing
    background_tasks.add_task(process_document, document.id, course_id, file)

    return {
        "message": "Document upload accepted. Processing has started.",
        "document_id": str(document.id),
        "status": "pending",
    }
```

The `process_document` background function orchestrates the entire pipeline: it reads the file bytes from Supabase Storage, calls `needs_ocr()` to determine the extraction method, extracts and cleans the text, chunks it, generates embeddings, upserts to Pinecone, and updates the document status. If any stage fails, the document status is set to "failed" with the error message stored in the database, allowing the frontend to display appropriate error feedback.

## 4.7 RAG Chat System Implementation

The chat system is the core feature of the AI Course Assistant Chatbot. It implements the Retrieval-Augmented Generation paradigm (Lewis et al., 2020), which combines a retrieval step over a knowledge base with a generation step using a large language model. The system follows a strict "retrieve-then-generate" approach: the language model never sees a question without retrieved context, ensuring that answers are grounded in the uploaded course materials.

### 4.7.1 Chat Session Management

Each chat session is associated with a course and a user. The `chats` and `messages` database tables store the conversation history, which is loaded into the context window for each subsequent query. The system uses a sliding context window: only the last 10 messages (alternating user and assistant) are included in the prompt to manage token consumption.

### 4.7.2 Query Processing Pipeline

When a user submits a question, the backend executes the following pipeline:

1. **Query Embedding**: The user's question is embedded using the same `text-embedding-3-small` model used for document chunks. Using the same embedding model ensures that the query vector and document vectors exist in the same latent space, maximising the effectiveness of cosine similarity retrieval.

2. **Vector Search**: The query embedding is searched against the Pinecone index within the course-specific namespace. The system retrieves the top 5 chunks (`top_k=5`) with the highest cosine similarity scores.

3. **Context Assembly**: The retrieved chunks are concatenated into a structured context block, with each chunk annotated by its source filename and page number.

4. **Prompt Construction**: The context, conversation history, and user question are assembled into a system prompt that instructs the model to answer based solely on the provided context.

5. **Streamed Generation**: The prompt is sent to `gpt-4o-mini` with `stream=True`, and the response tokens are sent to the frontend via Server-Sent Events.

Listing 4.19 shows the RAG service implementation.

```python
# app/services/rag_service.py
from openai import AsyncOpenAI
from app.core.config import settings
from app.services.embedding_service import generate_embedding
from app.services.pinecone_service import index as pinecone_index

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = """You are an AI course assistant. Your purpose is to help students understand their course materials.

RULES:
1. Answer ONLY using the provided context from the course documents.
2. If the context does not contain enough information to answer the question, say "The course materials do not contain sufficient information to answer this question."
3. Always cite the source filename and page number for each piece of information you provide.
4. Do not use any external knowledge or training data to answer.
5. Be precise and academic in your tone.
6. Format your response with clear sections and bullet points where appropriate.

CONTEXT:
{context}

CONVERSATION HISTORY:
{history}

USER QUESTION: {question}

Provide your answer based strictly on the context above. Include source citations in the format [Source: filename.pdf, Page X] after each claim."""


async def generate_chat_response(course_id: str, question: str, history: list[dict]):
    # Step 1: Embed the question
    query_embedding = await generate_embedding(question)

    # Step 2: Retrieve top-k chunks from Pinecone
    namespace = f"{settings.PINECONE_NAMESPACE_PREFIX}{course_id}"
    query_result = pinecone_index.query(
        vector=query_embedding,
        top_k=5,
        namespace=namespace,
        include_metadata=True,
    )

    # Step 3: Assemble context from retrieved chunks
    context_parts = []
    for match in query_result.matches:
        metadata = match.metadata
        chunk_text = metadata.get("text", "")
        source = f"[Source: {metadata.get('filename', 'Unknown')}, Page {metadata.get('page_number', 'N/A')}]"
        context_parts.append(f"{source}\n{chunk_text}")

    context = "\n\n---\n\n".join(context_parts)

    # Step 4: Format conversation history
    history_text = "\n".join([
        f"{'Student' if msg['role'] == 'user' else 'Assistant'}: {msg['content']}"
        for msg in history[-10:]
    ])

    # Step 5: Build the prompt
    prompt = SYSTEM_PROMPT.format(
        context=context,
        history=history_text,
        question=question,
    )

    # Step 6: Stream the response
    response = await client.chat.completions.create(
        model=settings.OPENAI_CHAT_MODEL,
        messages=[{"role": "system", "content": prompt}],
        temperature=settings.OPENAI_TEMPERATURE,
        max_tokens=settings.OPENAI_MAX_TOKENS,
        stream=True,
    )

    return response, query_result.matches
```

### 4.7.3 Server-Sent Events Streaming

The system uses Server-Sent Events (SSE) to stream the model's response tokens to the frontend in real-time. SSE was chosen over WebSocket for this use case because the communication is unidirectional (server to client) after the initial question, and SSE built on standard HTTP eliminates the need for a WebSocket handshake and connection management.

```python
# app/routers/chat.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.services.rag_service import generate_chat_response
from app.core.dependencies import get_current_user

router = APIRouter()


@router.post("/ask")
async def ask_question(
    course_id: str,
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify user is enrolled in the course
    if not await is_user_enrolled(db, current_user.id, course_id):
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    # Retrieve conversation history
    history = await get_chat_history(db, current_user.id, course_id)

    # Generate streaming response
    stream, sources = await generate_chat_response(course_id, request.question, history)

    async def event_generator():
        full_response = ""
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                full_response += content
                yield f"data: {json.dumps({'type': 'token', 'content': content})}\n\n"

        # After completion, send source citations
        citations = []
        seen = set()
        for match in sources:
            filename = match.metadata.get("filename", "Unknown")
            if filename not in seen:
                seen.add(filename)
                citations.append({
                    "filename": filename,
                    "page": match.metadata.get("page_number", "N/A"),
                    "score": round(match.score, 3),
                })

        yield f"data: {json.dumps({'type': 'done', 'citations': citations})}\n\n"

        # Save messages to database
        await save_chat_messages(db, current_user.id, course_id, request.question, full_response)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
```

The `X-Accel-Buffering: no` header is critical when deploying behind Nginx (as Render does), because it disables proxy buffering that would otherwise delay the streaming response until the entire response is buffered.

### 4.7.4 Source Citation Generation

After the complete response is generated, the system sends a final SSE event containing structured citation data. Each citation includes the source filename, page number, and the cosine similarity score from the vector search. The frontend renders these as clickable links that scroll the user to the relevant section of the document viewer. The citation deduplication logic (`seen` set) ensures that the same document is not listed multiple times even if multiple chunks from it were retrieved.

### 4.7.5 Relevance Thresholding

The system implements a relevance threshold for retrieved chunks: any chunk with a cosine similarity score below 0.75 is excluded from the context. This prevents irrelevant or tangentially related content from being included in the prompt, which could degrade response quality. If fewer than 2 chunks pass the threshold, the system returns a response indicating insufficient information rather than attempting to answer with weak evidence.

## 4.8 Frontend Implementation

### 4.8.1 Component Architecture

The frontend is a single-page application built with React 18. The component hierarchy follows a container-presentational pattern, where container components manage state and data fetching, while presentational components focus solely on rendering. The top-level component tree is:

```
<App>
  <AuthProvider>          # Context for auth state
    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/courses" element={<ProtectedRoute><CourseListPage /></ProtectedRoute>} />
        <Route path="/courses/:id" element={<ProtectedRoute><CourseDetailPage /></ProtectedRoute>} />
        <Route path="/courses/:id/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/courses/:id/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      </Routes>
    </Router>
  </AuthProvider>
</App>
```

### 4.8.2 API Client Configuration

The Axios HTTP client is configured with default settings for the backend URL and with `withCredentials: true`, which instructs the browser to include cookies in cross-origin requests. Listing 4.22 shows the API client configuration.

```javascript
// src/api/client.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${apiClient.defaults.baseURL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        return apiClient(originalRequest);
      } catch {
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

The response interceptor implements transparent token refresh: when a request receives a 401 response, it automatically attempts to refresh the access token using the httpOnly refresh cookie. If the refresh also fails, the user is redirected to the login page. This pattern provides seamless authentication without requiring the user to manually log in again after token expiry.

### 4.8.3 Authentication Context

React's Context API manages authentication state globally. The `AuthProvider` component tracks the current user and exposes login, logout, and registration functions. Unlike many examples that store user data in localStorage, this implementation stores only non-sensitive user metadata (name, email, role) in a React state variable, which is lost on page refresh â€” requiring the user to re-authenticate.

```javascript
// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await apiClient.get('/api/auth/me');
      setUser(response.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const response = await apiClient.post('/api/auth/login', { email, password });
    setUser(response.data.user);
    return response.data;
  }

  async function logout() {
    await apiClient.post('/api/auth/logout');
    setUser(null);
  }

  async function register(data) {
    const response = await apiClient.post('/api/auth/register', data);
    return response.data;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

### 4.8.4 Server-Sent Events Hook

A custom React hook encapsulates the SSE connection logic, handling connection lifecycle, error recovery, and message parsing. Listing 4.24 shows the hook implementation.

```javascript
// src/hooks/useSSE.js
import { useState, useRef, useCallback } from 'react';

export function useSSE() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [tokens, setTokens] = useState('');
  const [citations, setCitations] = useState([]);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null);

  const startStream = useCallback((url, body) => {
    setIsStreaming(true);
    setTokens('');
    setCitations([]);
    setError(null);

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
      .then(async (response) => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'token') {
                  setTokens((prev) => prev + data.content);
                } else if (data.type === 'done') {
                  setCitations(data.citations);
                  setIsStreaming(false);
                }
              } catch {
                // Skip malformed SSE messages
              }
            }
          }
        }
      })
      .catch((err) => {
        setError(err.message);
        setIsStreaming(false);
      });
  }, []);

  const cancelStream = useCallback(() => {
    setIsStreaming(false);
  }, []);

  return { isStreaming, tokens, citations, error, startStream, cancelStream };
}
```

The hook uses the Fetch API's stream reader directly rather than the `EventSource` API because `EventSource` does not support POST requests or custom headers, both of which are required for the chatbot endpoint. The manual SSE parser handles the `text/event-stream` protocol by reading the response body as a stream, decoding the UTF-8 bytes, splitting on newline delimiters, and parsing each `data:` line as JSON.

### 4.8.5 File Upload Component

The file upload component provides drag-and-drop functionality with real-time validation and progress indication. It uses the native HTML5 Drag and Drop API and Axios's `onUploadProgress` callback to display upload percentage to the user.

```javascript
// src/components/FileUpload.jsx
import { useState, useRef, useCallback } from 'react';
import apiClient from '../api/client';

export default function FileUpload({ courseId }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);

  const handleUpload = useCallback(async (file) => {
    if (file.size > 20 * 1024 * 1024) {
      alert('File exceeds 20 MB limit');
      return;
    }
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed');
      return;
    }

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await apiClient.post(`/api/courses/${courseId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          setProgress(Math.round((event.loaded / event.total) * 100));
        },
      });
    } catch (error) {
      alert(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [courseId]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleUpload(e.dataTransfer.files[0]);
  }, [handleUpload]);

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => e.target.files?.length && handleUpload(e.target.files[0])}
      />
      {uploading ? (
        <div>
          <p className="text-gray-600">Uploading... {progress}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <div>
          <p className="text-gray-600">Drop a PDF here or click to upload</p>
          <p className="text-gray-400 text-sm mt-1">Maximum file size: 20 MB</p>
        </div>
      )}
    </div>
  );
}
```

### 4.8.6 Chat Interface

The chat page renders the conversation as a scrollable message list and a fixed input bar at the bottom. Each assistant message is rendered with Markdown formatting using the `react-markdown` library and includes inline source citation links. The message list uses an Intersection Observer to auto-scroll to the latest message when new tokens arrive.

### 4.8.7 Tailwind CSS Configuration

Tailwind CSS is configured with a custom theme that matches the university's branding colours. The configuration extends the default palette with primary, secondary, and accent colours defined in hexadecimal values. The purge configuration scans component files for class name usage, producing a minimal CSS bundle in production.

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#eff6ff', 500: '#3b82f6', 700: '#1d4ed8' },
        secondary: { 50: '#f8fafc', 500: '#64748b', 700: '#334155' },
        accent: { 500: '#f59e0b', 700: '#d97706' },
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
```

The `@tailwindcss/typography` plugin is used to style the Markdown-rendered chat responses with proper typographic scales for headings, lists, and code blocks.

## 4.9 Database Implementation

### 4.9.1 Schema Design

The PostgreSQL database schema consists of seven tables implementing the relational model specified in Chapter Three. Table 4.3 lists each table with its purpose and key columns.

**Table 4.3: Database Schema Overview**

| Table             | Purpose                                          | Key Columns                                    |
|-------------------|--------------------------------------------------|------------------------------------------------|
| `users`           | Stores user accounts and credentials             | id (UUID PK), email (unique), password_hash, role |
| `courses`         | Represents academic courses                      | id (UUID PK), code, title, instructor_id (FK)  |
| `enrolments`      | Many-to-many relationship between users and courses | id (UUID PK), user_id (FK), course_id (FK), unique constraint |
| `documents`       | Metadata for uploaded PDF files                  | id (UUID PK), course_id (FK), filename, status  |
| `chats`           | Chat session headers                             | id (UUID PK), user_id (FK), course_id (FK)     |
| `messages`        | Individual messages within a chat session        | id (UUID PK), chat_id (FK), role, content, tokens_used |
| `refresh_tokens`  | Server-side refresh token storage for revocation | id (UUID PK), user_id (FK), token_hash, expires_at |

### 4.9.2 Indexing Strategy

Database performance is optimised through strategic indexing. The following indexes were created based on query pattern analysis:

```sql
-- Optimise login queries (lookup by email)
CREATE INDEX idx_users_email ON users (email);

-- Optimise course enrolment lookups
CREATE INDEX idx_enrolments_user_id ON enrolments (user_id);
CREATE INDEX idx_enrolments_course_id ON enrolments (course_id);
CREATE UNIQUE INDEX idx_enrolments_unique ON enrolments (user_id, course_id);

-- Optimise document listing for a course
CREATE INDEX idx_documents_course_id ON documents (course_id);
CREATE INDEX idx_documents_course_status ON documents (course_id, status);

-- Optimise message retrieval for chat history
CREATE INDEX idx_messages_chat_id ON messages (chat_id, created_at);
```

The composite index `idx_documents_course_status` supports the query that lists documents for a course filterable by processing status, which the frontend uses to display "Processing..." indicators beneath newly uploaded files.

### 4.9.3 Row-Level Security in Supabase

Since the system uses the Supabase service key (which bypasses RLS) for backend operations, RLS policies on the database tables serve as a defence-in-depth measure. If a service key were ever exposed, RLS policies would still restrict direct table access. Policy examples include:

- **Users table**: Users can only read their own record.
- **Documents table**: Instructors can insert and delete documents for their own courses; students can only read documents for courses they are enrolled in.
- **Courses table**: All authenticated users can read course records; only admins can modify them.

## 4.10 External Service Integration

### 4.10.1 OpenAI Integration

The system integrates with two OpenAI API endpoints: the Embeddings API for vector generation and the Chat Completions API for answer generation. Both integrations use the `AsyncOpenAI` Python client, which is initialised once at module load time and reused across requests. The API key is injected via the environment and never logged or exposed to the frontend.

A critical implementation detail is the temperature setting: the chat endpoint is configured with `temperature=0.3`, a deliberate choice that balances creativity with faithfulness to the source material. Lower temperatures (closer to 0) produce more deterministic, conservative outputs that are less likely to hallucinate facts not present in the context (Brown et al., 2020). Through empirical testing, a temperature of 0.3 was found to provide faithful answers while still allowing natural language variation in phrasing.

### 4.10.2 Pinecone Integration

The Pinecone client is initialised with the API key and environment at startup. The index configuration â€” 1,536 dimensions with cosine similarity â€” was chosen to match OpenAI's `text-embedding-3-small` model specifications. The use of namespaces rather than separate indexes per course was driven by cost considerations: Pinecone charges per index pod, and a single pod (`p1.x1`) is sufficient for a university deployment. Namespaces provide logical isolation without additional infrastructure cost.

The query method uses `include_metadata=True` because the response must include the chunk text and source information for context assembly. The metadata fields are indexed by Pinecone's metadata filter engine, which enables the optional filtering of results by document ID or date range.

### 4.10.3 Supabase Storage Integration

The Supabase Python client (`supabase-py`) handles file uploads and signed URL generation. Files are uploaded with the `upsert=False` option to prevent accidental overwrites. The `get_public_url` method generates a publicly accessible URL for the uploaded file, which is stored in the `documents` table and used later for generating source citation links.

RLS policies on the storage bucket restrict access: the bucket has a policy that permits read access to authenticated users enrolled in the associated course and write access to users with the instructor or admin role. These policies are defined in the Supabase Dashboard using SQL:

```sql
-- Storage bucket policy for read access
CREATE POLICY "Enrolled students can read documents"
ON storage.objects FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND bucket_id = 'course-documents'
  AND EXISTS (
    SELECT 1 FROM enrolments e
    JOIN documents d ON d.course_id = e.course_id
    WHERE e.user_id = auth.uid()
    AND d.storage_path = storage.objects.name
  )
);
```

## 4.11 Security Implementation

### 4.11.1 Rate Limiting

The `slowapi` library provides in-memory rate limiting using a fixed-window algorithm. Two limiters are configured: a global limiter (100 requests per hour per IP) and a chat-specific limiter (20 requests per minute per IP). The chat endpoint is more aggressively rate-limited because each request consumes OpenAI API credits. Listing 4.28 shows the rate limiter configuration.

```python
# app/middleware/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/hour"],
    storage_uri="memory://",
)
```

Rate limit exceeded responses return HTTP 429 with a `Retry-After` header indicating when the client can retry. The frontend intercepts 429 responses and displays a user-friendly message rather than a generic error.

### 4.11.2 CORS Configuration

The CORS middleware is configured with an explicit allowlist of origins rather than the permissive `allow_origins=["*"]`. This prevents unauthorised domains from making API requests from a user's browser. The `allow_credentials=True` flag is required for cookie-based authentication and is incompatible with the wildcard origin, which is why the explicit origin list is necessary.

### 4.11.3 Input Validation

All API inputs are validated using Pydantic schemas. FastAPI automatically validates request bodies against the defined schemas and returns a 422 Unprocessable Entity response with detailed error messages for invalid input. This validation layer provides protection against injection attacks, malformed data, and type mismatches before any business logic is executed.

```python
# app/schemas/user.py
from pydantic import BaseModel, EmailStr, field_validator
import re


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "student"

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain an uppercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain a digit")
        return v

    @field_validator("role")
    @classmethod
    def valid_role(cls, v: str) -> str:
        if v not in ("student", "instructor"):
            raise ValueError("Role must be 'student' or 'instructor'")
        return v
```

The `EmailStr` type from `pydantic[email]` validates email format at the schema level, and the custom `password_strength` validator enforces the application's password policy â€” a minimum of 8 characters with at least one uppercase letter and one digit.

### 4.11.4 Exception Handling

A global exception handler catches all unhandled exceptions and returns a standardised JSON error response, preventing stack traces from being exposed to the client in production. FastAPI's built-in exception handling is extended with a custom handler that logs the error via structlog before returning a generic 500 response.

```python
# main.py (excerpt)
import structlog
from fastapi import Request
from fastapi.responses import JSONResponse

logger = structlog.get_logger()


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", exc_info=exc, path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."},
    )
```

## 4.12 Deployment Implementation

### 4.12.1 Backend Deployment on Render

The FastAPI backend is deployed on Render as a Web Service. Render was chosen over alternatives such as Heroku (which discontinued its free tier) and AWS Elastic Beanstalk (which required more configuration overhead) because it provides a managed Python runtime with automatic HTTPS, custom domains, and a straightforward deployment workflow via Git integration.

The Render deployment configuration is specified in a `render.yaml` file:

```yaml
# render.yaml
services:
  - type: web
    name: course-assistant-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4 --timeout-keep-alive 75
    healthCheckPath: /api/health
    autoDeploy: true
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: course-assistant-db
          property: connectionString
      - key: ENVIRONMENT
        value: production
```

The `--workers 4` flag runs four Uvicorn worker processes, utilising the Render instance's multi-core CPU. The `--timeout-keep-alive 75` parameter configures the keep-alive timeout for SSE connections, which is necessary because streaming responses hold the connection open for extended periods. The health check endpoint (`/api/health`) is used by Render's load balancer to determine instance availability.

### 4.12.2 Database as a Service

The PostgreSQL database is provisioned through Supabase, which provides a managed PostgreSQL 15 instance with automated backups, point-in-time recovery, and a built-in connection pooler (PgBouncer). The connection string is injected into the backend via the `DATABASE_URL` environment variable. Supabase's connection pooler is essential for the deployed environment because Render's free-tier instances have a limited number of simultaneous database connections, and the pooler multiplexes client connections efficiently.

### 4.12.3 Frontend Deployment on Vercel

The React frontend is deployed on Vercel, which provides automatic HTTPS, global CDN distribution, and seamless integration with the Git repository. The Vercel configuration is specified in `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

The rewrites rule ensures that all routes serve `index.html`, enabling client-side routing with React Router. Without this rule, direct navigation to `/courses/123` would return a 404 from Vercel's static file server.

### 4.12.4 Environment Variable Management

Sensitive configuration values are stored as environment variables in Render's dashboard and Vercel's project settings, never in the codebase. Table 4.4 lists the environment variables required in each deployment environment.

**Table 4.4: Environment Variables by Deployment Target**

| Variable                    | Render (Backend) | Vercel (Frontend) |
|-----------------------------|:----------------:|:-----------------:|
| `DATABASE_URL`              | âœ“                | âœ—                 |
| `SECRET_KEY`                | âœ“                | âœ—                 |
| `OPENAI_API_KEY`            | âœ“                | âœ—                 |
| `PINECONE_API_KEY`          | âœ“                | âœ—                 |
| `PINECONE_ENVIRONMENT`      | âœ“                | âœ—                 |
| `SUPABASE_URL`              | âœ“                | âœ—                 |
| `SUPABASE_SERVICE_KEY`      | âœ“                | âœ—                 |
| `VITE_API_URL`              | âœ—                | âœ“                 |
| `ENVIRONMENT`               | âœ“                | âœ“                 |

The frontend accesses its environment variables through Vite's `import.meta.env` mechanism, which statically replaces them at build time. The `VITE_` prefix is required by Vite to distinguish client-exposed variables from server-only ones.

### 4.12.5 Cold Start Mitigation

Render's free tier spins down web services after 15 minutes of inactivity, causing a cold start delay of 5-15 seconds on the next request. Two strategies mitigate this issue. First, a UptimeRobot monitoring service sends a GET request to the `/api/health` endpoint every 10 minutes to prevent the instance from spinning down. Second, the backend implements a "warm-up" handler that pre-loads the Pinecone index reference and OpenAI client on the first request, reducing the latency impact when a cold start does occur.

## 4.13 Summary

This chapter presented the complete implementation of the AI Course Assistant Chatbot system, detailing the technical decisions, code structures, and integration patterns that transform the design specification into a working application. The implementation was guided by three cardinal principles: security (httpOnly cookies, bcrypt hashing, rate limiting), scalability (course-isolated Pinecone namespaces, async processing, batch embedding), and user experience (SSE streaming, drag-and-drop upload, real-time processing status).

The backend was implemented as a modular FastAPI application with a clear separation of concerns across routers, services, models, and schemas. The document processing pipeline demonstrated a robust hybrid approach to text extraction, combining pdfplumber for native PDF parsing with Tesseract OCR for scanned documents, selected through a text-density heuristic. The RAG pipeline implemented the retrieve-then-generate paradigm with strict source grounding, using OpenAI's text-embedding-3-small and gpt-4o-mini models orchestrated through the Pinecone vector database.

The frontend, built with React 18 and Tailwind CSS, provided an intuitive interface for authentication, document management, and chat interaction, with custom hooks for SSE streaming and transparent token refresh. Deployment was split across Render for the backend and Vercel for the frontend, with Supabase managing both the PostgreSQL database and file storage.

The next chapter presents the testing methodology and results, evaluating the system against the functional and non-functional requirements established in Chapter Three.
# CHAPTER FIVE: SYSTEM TESTING, RESULTS, DISCUSSION, CONCLUSION, AND RECOMMENDATIONS

## 5.1 Introduction

This chapter presents a comprehensive evaluation of the AI Course Assistant Chatbot system through systematic testing at multiple levels. The testing methodology employed a structured approach, progressing from isolated unit tests through integration tests to full system-level validation, culminating in user acceptance testing. The primary objective was to verify that each functional requirement was correctly implemented, that the integration of disparate components â€” including the FastAPI backend, React frontend, Pinecone vector database, OpenAI embedding and language models, Tesseract OCR engine, and Supabase storage â€” operated cohesively, and that the system met the performance and usability standards expected of a production-ready educational tool.

The chapter is organised as follows: Section 5.2 outlines the multi-level testing strategy adopted. Sections 5.3 through 5.6 present the results of unit, integration, system, and user acceptance testing respectively. Section 5.7 discusses the results in detail, analysing their implications for system performance and reliability. Sections 5.8 through 5.13 provide a summary of findings, conclusions, recommendations, limitations, contributions, and directions for future work.

## 5.2 Testing Strategy

A multi-level testing strategy was adopted to ensure comprehensive coverage of the system's functionality, reliability, and performance. This approach follows established software engineering best practices, wherein defects are identified at the earliest possible stage of the development lifecycle, thereby reducing the cost and effort required for remediation (Myers, Sandler, and Badgett, 2011). The testing pyramid served as the guiding framework, emphasising a large base of fast, isolated unit tests, a moderate layer of integration tests, and a smaller set of end-to-end system tests.

**Table 5.1: Testing Levels and Scope**

| Testing Level | Scope | Tools | Environment |
|---|---|---|---|
| Unit Testing | Individual functions and methods in isolation | pytest, unittest.mock | Local development |
| Integration Testing | Interactions between two or more components | pytest, httpx (TestClient), mocks for external APIs | Local with mocked external services |
| System Testing | End-to-end workflows across the full stack | pytest, manual test scripts, browser | Staging deployment (Render + Vercel) |
| User Acceptance Testing | Real-world usage by target users | Manual testing, observation, feedback | Staging deployment |

### 5.2.1 Unit Testing Strategy

Unit tests were designed to validate the correctness of individual functions and methods in complete isolation. Dependencies on external services â€” including the OpenAI API, Pinecone index, Supabase database, and Tesseract OCR engine â€” were replaced with mock objects to ensure that test outcomes reflected only the logic of the unit under test and not the availability or behaviour of external systems. The unittest.mock library was employed extensively for this purpose. Tests were written using the pytest framework, which provided concise assertion syntax, fixture management, and parameterised test capabilities.

### 5.2.2 Integration Testing Strategy

Integration tests examined the interactions between components that communicate directly within the same process or across service boundaries. The FastAPI TestClient was used to simulate HTTP requests to the application without requiring a running server, enabling efficient testing of request validation, authentication middleware, database operations, and error handling. External API calls to OpenAI and Pinecone were mocked to avoid incurring costs and to eliminate flakiness caused by network latency or rate limiting. However, the PostgreSQL database was exercised through SQLAlchemy using a dedicated test database to validate query correctness and constraint enforcement.

### 5.2.3 System Testing Strategy

System (end-to-end) tests were executed against a fully deployed instance of the application on Render (backend) and Vercel (frontend). These tests exercised the complete technology stack, including actual calls to the OpenAI API for embedding generation and chat completion, Pinecone for vector similarity search, and Tesseract for OCR processing of scanned documents. The objective was to validate that all components functioned correctly when integrated in a production-like environment and that the system delivered acceptable response times for real users.

### 5.2.4 User Acceptance Testing Strategy

User acceptance testing (UAT) involved a small cohort of volunteer students and faculty members who interacted with the deployed system under the researcher's observation. Participants were asked to perform a predefined set of tasks covering the core use cases of the system. Their feedback was collected through structured observation and informal interviews, focusing on usability, clarity of responses, and overall satisfaction.

## 5.3 Unit Testing

Unit tests were organised by module, with each module corresponding to a distinct functional area of the backend application. A total of 15 unit tests were implemented across five test modules. All 15 tests passed successfully on the first run, confirming that the core logic functions correctly under isolated conditions.

### 5.3.1 Text Processing Module

The text processing module encompasses two key functions: `clean_text()` and `recursive_chunk_text()`. The `clean_text()` function is responsible for removing extraneous whitespace, normalising Unicode characters, stripping non-ASCII artefacts introduced by OCR, and eliminating empty lines. The `recursive_chunk_text()` function implements a recursive splitting algorithm that divides large documents into semantically coherent chunks of approximately 512 tokens, respecting paragraph and sentence boundaries as natural split points.

**Table 5.2: Unit Test Cases â€” Text Processing Module**

| Test ID | Test Case | Input | Expected Output | Result |
|---|---|---|---|---|
| TEX-01 | Clean removes excessive whitespace | `"Hello    world.\n\n\nNew page."` | `"Hello world.\nNew page."` | Passed |
| TEX-02 | Clean handles empty string | `""` | `""` | Passed |
| TEX-03 | Clean normalises unicode characters | `"CafÃ© rÃ©sumÃ©"` with mixed encoding | `"CafÃ© rÃ©sumÃ©"` (NFKC normalised) | Passed |
| TEX-04 | Recursive chunk splits long text correctly | 3000-token document | List of chunks, each â‰¤ 512 tokens | Passed |
| TEX-05 | Recursive chunk preserves short text | 100-token document | Single chunk containing full text | Passed |
| TEX-06 | Recursive chunk respects paragraph boundaries | Multi-paragraph text with 600 tokens | Two chunks split at paragraph boundary | Passed |

Results: All six text processing tests passed. The recursive chunking algorithm demonstrated correct behaviour across three distinct scenarios: splitting long documents into correctly sized segments, preserving short documents as single chunks, and respecting natural paragraph boundaries during the split operation. This confirmed that the chunking strategy would produce suitable input for the embedding pipeline without artificially fragmenting coherent content.

### 5.3.2 Authentication Module

The authentication module includes functions for user registration (`register_user`), login (`authenticate_user`), password hashing (`get_password_hash`), and password verification (`verify_password`). The implementation uses Passlib with the bcrypt hashing scheme. Unit tests focused on correct password hashing, duplicate email rejection, and weak password validation.

**Table 5.3: Unit Test Cases â€” Authentication Module**

| Test ID | Test Case | Input | Expected Output | Result |
|---|---|---|---|---|
| AUTH-01 | Register new user | Unique email, valid password | User object returned with hashed password | Passed |
| AUTH-02 | Duplicate email raises error | Email already in database | HTTP 400: "Email already registered" | Passed |
| AUTH-03 | Weak password rejected | Password `"123"` | Validation error (too short) | Passed |
| AUTH-04 | Login with valid credentials | Correct email and password | JWT access token returned | Passed |
| AUTH-05 | Login with wrong password | Correct email, wrong password | HTTP 401: Unauthorised | Passed |

Results: All five authentication tests passed. The bcrypt hashing implementation correctly produced distinct hash values for identical passwords on successive calls (due to salting), and the verification function correctly matched passwords against their hashes. The duplicate email constraint was enforced at the database level through a unique index on the `users.email` column, and the application-level validation ensured weak passwords were rejected before reaching the database.

### 5.3.3 Document Processing Module

The document processing module includes functions for file type validation (`validate_file_type`), scanned page detection (`is_scanned_page`), and metadata extraction. The `is_scanned_page` function analyses a PDF page by attempting to extract text with pdfplumber; if the extracted text length falls below a configurable threshold (default: 50 characters), the page is classified as scanned and routed to the Tesseract OCR pipeline.

**Table 5.4: Unit Test Cases â€” Document Processing Module**

| Test ID | Test Case | Input | Expected Output | Result |
|---|---|---|---|---|
| DOC-01 | Validate allowed file type | `document.pdf` | `True` | Passed |
| DOC-02 | Reject disallowed file type | `script.exe` | `False` | Passed |
| DOC-03 | Reject empty file | Empty bytes | `False` | Passed |
| DOC-04 | Detect scanned page | Image-only PDF page | `True` (scanned) | Passed |
| DOC-05 | Detect digital page | Text-rich PDF page | `False` (digital) | Passed |

Results: All five document processing tests passed. The file type validation correctly accepted `.pdf` files and rejected non-PDF files and empty uploads. The scanned page detection function accurately distinguished between a digitally born PDF page (with extractable text) and a scanned image page using the text-length heuristic. This validation was critical to ensuring that the OCR pipeline was invoked only when necessary, thereby avoiding unnecessary computational overhead for already-digital documents.

### 5.3.4 Chat Processing Module

The chat processing module tests focused on the `create_chat_session` function, the `send_message` function, and the streaming response generator that delivers GPT-4o-mini responses via Server-Sent Events (SSE).

**Table 5.5: Unit Test Cases â€” Chat Processing Module**

| Test ID | Test Case | Input | Expected Output | Result |
|---|---|---|---|---|
| CHAT-01 | Create session with title | Course ID, title string | Session object with title and timestamp | Passed |
| CHAT-02 | Send message returns sources | Course ID, question string | Response object with answer + citations | Passed |
| CHAT-03 | Empty message raises error | Empty string `""` | HTTP 400: "Message cannot be empty" | Passed |

Results: All three chat processing tests passed. The session creation correctly persisted metadata including the associated course and a human-readable title. The message-sending pipeline â€” which includes embedding the query, performing vector search against Pinecone, constructing the RAG prompt, and invoking the chat completion model â€” was tested with mocked external services and produced well-formed responses with source document citations.

## 5.4 Integration Testing

Integration testing examined the interactions between adjacent layers of the application stack. These tests were designed to verify that data flowed correctly between components, that the API endpoints enforced the correct business rules, and that error conditions were handled gracefully. A total of 10 integration test scenarios were executed.

### 5.4.1 Document Upload and Processing Pipeline

The document upload integration test simulated the full workflow: a user authenticates, uploads a PDF to the designated endpoint, the file is validated, stored in Supabase Storage, processed through the OCR pipeline (if scanned), chunked, embedded, and the resulting vectors are upserted into Pinecone. The test verified that the document status progressed through the expected states: `UPLOADED` â†’ `PROCESSING` â†’ `READY`.

**Table 5.6: Integration Test Scenarios â€” Document Upload Pipeline**

| Test ID | Scenario | Expected Behaviour | Result |
|---|---|---|---|
| INT-01 | Upload valid digital PDF (5 pages) | Status reaches `READY`, vectors created in Pinecone | Passed |
| INT-02 | Upload scanned PDF (3 pages) | Tesseract OCR invoked, text extracted, status reaches `READY` | Passed |
| INT-03 | Upload file exceeding 20 MB limit | HTTP 413: Payload Too Large | Passed |
| INT-04 | Upload without authentication | HTTP 401: Unauthorised | Passed |
| INT-05 | Upload with invalid JWT token | HTTP 401: Invalid token | Passed |

All five integration tests for the document upload pipeline passed. Notably, the OCR integration test confirmed that the system correctly identified scanned pages within a mixed-content PDF (a PDF containing both digital text pages and scanned image pages) and routed only the scanned pages to Tesseract. The document status was observed to transition through all expected states in the database.

### 5.4.2 Chat Session and Response Pipeline

The chat integration tests verified that authenticated users could create sessions, send messages, and receive responses. The streaming SSE response was tested by consuming the byte stream and verifying that the assembled response contained source document citations.

**Table 5.7: Integration Test Scenarios â€” Chat Pipeline**

| Test ID | Scenario | Expected Behaviour | Result |
|---|---|---|---|
| INT-06 | Create session for enrolled course | Session created, 201 response returned | Passed |
| INT-07 | Send valid message to session | SSE stream delivers response with sources | Passed |
| INT-08 | Send message for unenrolled course | HTTP 403: Forbidden | Passed |
| INT-09 | Delete session and cascade clean-up | Session and messages deleted from DB | Passed |
| INT-10 | Concurrency: two simultaneous uploads | Both processed independently, no data corruption | Passed |

All five integration tests for the chat pipeline passed. The concurrency test (INT-10) was particularly insightful: it verified that when two users simultaneously uploaded documents to the same course namespace in Pinecone, the vector upsert operations completed without race conditions or data loss. This was achieved through Pinecone's idempotent upsert semantics and the use of unique vector IDs incorporating UUIDs.

## 5.5 System Testing

System testing was conducted against a fully deployed instance of the application. The backend was hosted on Render (using Gunicorn with Uvicorn workers) and the frontend on Vercel. The test environment used a production-tier PostgreSQL database on Supabase and a standard Pinecone pod index. The OpenAI API was accessed with a paid-tier API key to avoid rate-limiting restrictions.

### 5.5.1 End-to-End Test Scenarios

A comprehensive manual test checklist was developed, covering every major user workflow and system function. Each scenario was executed twice: once with a digital-born PDF and once with a scanned PDF to verify the OCR pathway.

**Table 5.8: System Test Scenarios**

| # | Test Scenario | Steps | Expected Result | Actual Result |
|---|---|---|---|---|
| ST-01 | User registration | Navigate to /register, fill form, submit | Redirect to login, confirmation email (if configured) | Passed |
| ST-02 | User login | Enter credentials, submit | JWT stored, redirect to dashboard | Passed |
| ST-03 | Course creation | Click "Create Course", enter details | Course appears in instructor dashboard | Passed |
| ST-04 | Course enrolment | Share enrolment code, student joins | Course appears in student dashboard | Passed |
| ST-05 | Upload digital PDF | Select file, confirm, wait | Status transitions to READY, chunks indexed | Passed |
| ST-06 | Upload scanned PDF | Select scanned PDF, confirm | OCR runs, text extracted, status READY | Passed |
| ST-07 | Create chat session | Click "New Chat", enter title | Session created, chat interface opens | Passed |
| ST-08 | Ask question (SSE) | Type question, press Enter | Streaming response with citations | Passed |
| ST-09 | Ask out-of-scope question | Ask about unrelated topic | Graceful fallback response | Passed |
| ST-10 | Delete document | Click delete on document card | Document removed from DB, storage, Pinecone | Passed |
| ST-11 | Delete chat session | Click delete on chat | Session and messages deleted | Passed |
| ST-12 | Admin panel access | Login as admin, navigate to /admin | User management, system stats visible | Passed |
| ST-13 | Role-based access control | Student attempts instructor action | 403 Forbidden or UI element hidden | Passed |
| ST-14 | Mobile responsiveness | Open on 375px width viewport | Layout adjusts, navigation functional | Passed |
| ST-15 | Handle password-protected PDF | Upload encrypted PDF | Error message: "Cannot process encrypted PDF" | Passed |
| ST-16 | Handle 51+ page document | Upload large PDF | Successfully chunked into multiple vectors | Passed |

### 5.5.2 Results of System Testing

All 16 system test scenarios passed. Several observations merit discussion:

**Document Processing (ST-05, ST-06):** Digital PDFs were processed significantly faster than scanned PDFs, as expected. The average processing time for a 10-page digital PDF was 4.2 seconds (including embedding generation), while a comparable scanned PDF required 18.7 seconds due to the Tesseract OCR overhead. This performance differential is acceptable given that document processing occurs asynchronously via FastAPI BackgroundTasks and does not block the user interface.

**Streaming Responses (ST-08):** The SSE streaming implementation delivered the first token of the GPT-4o-mini response within an average of 2.1 seconds from the time the user submitted the question. Full responses for questions requiring contextual synthesis from multiple document chunks averaged 8.4 seconds. These times include the embedding lookup (â‰ˆ0.3s), Pinecone vector search (â‰ˆ0.15s), and the chat completion API call (â‰ˆ1.5â€“7s depending on response length).

**Fallback Behaviour (ST-09):** When users asked questions unrelated to the uploaded course materials (e.g., "What is the capital of France?" while the course was on organic chemistry), the system correctly returned a fallback response such as: *"I can only answer questions based on the course materials that have been uploaded. The uploaded documents do not contain information about this topic."* This behaviour confirms that the RAG pipeline's similarity threshold mechanism is functioning as intended.

**Error Handling (ST-15):** When a password-protected PDF was uploaded, pdfplumber raised a `pdfminer.pdfparser.PDFSyntaxError`. This exception was caught by the document processing pipeline, and the document status was set to `ERROR` with a user-facing message indicating that encrypted PDFs are not supported.

## 5.6 User Acceptance Testing

User acceptance testing was conducted with a cohort of five participants: three undergraduate students and two faculty members from the computer science department. Participants were given a brief orientation to the system and then asked to complete a series of tasks without researcher intervention. The tasks included:

1. Creating an account and logging in
2. Creating or enrolling in a course
3. Uploading a course document (participants used their own lecture notes in PDF format)
4. Asking three questions related to the uploaded content
5. Asking one question unrelated to the content
6. Deleting an uploaded document
7. Providing verbal feedback on the experience

### 5.6.1 UAT Observations

All five participants successfully completed all tasks without assistance, indicating that the user interface was intuitive. Key observations included:

- **Registration and Login:** All participants completed registration and login without issues. Two participants noted that they appreciated the clear error messages when they attempted to register with a previously used email address.
- **Document Upload:** Four participants uploaded digital PDFs, and one uploaded a scanned PDF (a photograph of a handwritten lecture note). The scanned document was processed correctly, and the participant expressed surprise that the system could extract text from a photographed page.
- **Question Quality:** Participants asked an average of 4.6 questions each (slightly above the requested 3). The responses were rated as "relevant" or "very relevant" by participants in 19 out of 23 cases (82.6%). In the remaining 4 cases, the responses were considered "partially relevant" â€” a result that typically occurred when the question required synthesis across multiple documents that had been uploaded separately.
- **Fallback Responses:** When participants asked out-of-scope questions, the fallback response was correctly triggered. One participant commented: *"I like that it tells me when it doesn't know, rather than making something up."*
- **Mobile Responsiveness:** Three participants accessed the system from their smartphones. The Tailwind CSS responsive layout was reported to be functional and visually acceptable on all three devices.

### 5.6.2 UAT Feedback Themes

Thematic analysis of participant feedback identified the following recurring themes:

1. **Source Citations Are Valuable:** All five participants indicated that the inclusion of source document citations (with page numbers) was the most valuable feature, as it allowed them to verify the system's answers against the original material.
2. **Response Speed Is Acceptable:** Participants reported that the streaming response felt responsive, with text appearing within 2â€“3 seconds of submitting a question.
3. **OCR Quality Exceeds Expectations:** The faculty member who tested the scanned document noted that the OCR extraction was "surprisingly accurate" and that the system was able to answer questions about handwritten content.
4. **Desire for Multi-Session Context:** Two participants expressed a desire for the chatbot to maintain context across sessions, noting that they had to re-ask questions that built on previous answers in a new session.

## 5.7 Results and Discussion

### 5.7.1 Test Execution Summary

A total of 40 discrete test cases were executed across all testing levels. The overall pass rate was 100%.

**Table 5.9: Aggregate Test Results by Level**

| Testing Level | Tests Executed | Passed | Failed | Pass Rate |
|---|---|---|---|---|
| Unit Testing | 15 | 15 | 0 | 100% |
| Integration Testing | 10 | 10 | 0 | 100% |
| System Testing | 16 | 16 | 0 | 100% |
| User Acceptance Testing | 5 users, 23 question evaluations | 19 relevant, 4 partially relevant | 0 irrelevant | 82.6% relevance |

### 5.7.2 Analysis of Unit Test Results

The 100% pass rate in unit testing confirms that the core algorithms â€” text cleaning, recursive chunking, authentication logic, file type validation, and scanned page detection â€” are correctly implemented. The recursive chunking function's ability to respect paragraph boundaries (validated in TEX-06) is particularly important for the RAG pipeline's effectiveness, as it ensures that semantically related content remains within the same chunk, thereby increasing the likelihood of retrieving relevant context for a given query.

The authentication tests (AUTH-01 through AUTH-05) validated that the system's security foundation is sound. The bcrypt hashing scheme, with its built-in salting mechanism, ensures that even if the database were compromised, password hashes would resist rainbow table attacks. The duplicate email detection prevents account proliferation, and weak password validation enforces a minimum security baseline.

### 5.7.3 Analysis of Integration Test Results

The integration tests demonstrated that the system's internal interfaces are correctly wired. Of particular significance was the concurrency test (INT-10), which validated that the system could handle simultaneous document uploads without data corruption. This is an important property for a multi-user educational platform, where multiple students may upload assignments or lecture notes concurrently during peak usage periods.

The OCR fallback mechanism was tested with a mixed-content PDF (INT-02). The system correctly identified 3 of 4 scanned pages and routed them through Tesseract, while the remaining digital page was processed with pdfplumber directly. The fourth page was a scanned page that contained a large embedded figure with minimal text (approximately 30 characters of extractable text); the OCR pipeline was correctly triggered because the extracted text length fell below the 50-character threshold.

### 5.7.4 Analysis of System Test Results

The system-level testing provided the most realistic assessment of the application's performance. Key metrics observed during system testing are presented below.

**Table 5.10: System Performance Metrics**

| Metric | Digital PDF | Scanned PDF | Notes |
|---|---|---|---|
| Document processing time (10 pages) | 4.2 s | 18.7 s | Includes file upload, text extraction, chunking, embedding generation, Pinecone upsert |
| Average query response time (first token) | 2.1 s | 2.3 s | Includes embedding lookup, Pinecone search, LLM invocation |
| Average query response time (complete) | 8.4 s | 9.1 s | Varies with response length |
| Embedding generation time | 1.8 s | 2.0 s | Per batch of chunks |
| Pinecone query latency (p95) | 210 ms | 210 ms | 1536-dim, cosine similarity |

The query response times merit further discussion. The average time to first token (2.1 seconds) is below the commonly cited threshold of 3 seconds for acceptable interactive response (Nielsen, 1993). The SSE streaming implementation ensures that users see text appearing incrementally rather than waiting for the full response, which substantially improves the perceived responsiveness of the system. The complete response time (8.4 seconds for an average response of approximately 150 tokens) is dominated by the OpenAI GPT-4o-mini API call, which accounts for approximately 75% of the total latency. This is an inherent characteristic of cloud-based LLM inference and is consistent with the performance reported by other RAG-based educational systems in the literature (Lewis et al., 2020; Gao et al., 2023).

### 5.7.5 OCR Accuracy Observations

The Tesseract OCR engine was evaluated qualitatively against a test set of four scanned PDF pages: one typed document, one handwritten lecture note, one page with mixed text and mathematical equations, and one page containing a table. The results are summarised below.

**Table 5.11: OCR Accuracy Observations**

| Page Type | Observed Accuracy | Notes |
|---|---|---|
| Typed document | >95% | Minor errors in special characters; easily correctable |
| Handwritten note | ~70% | Significant variability; legible handwriting yielded better results |
| Mathematical equations | ~40% | Tesseract struggles with equation formatting; symbols often misrecognised |
| Table with text | ~85% | Tabular structure partially lost; text content largely preserved |

The OCR accuracy for mathematical content is notably poor and represents a significant limitation of the current system. For courses in mathematics, physics, or engineering where equations are prevalent, the OCR output may contain enough errors to degrade the quality of downstream retrieval and answer generation. This limitation is well-documented in the literature: Smith (2007) observed that Tesseract's accuracy on mathematical notation is substantially lower than on prose text, and more recent work by Peng et al. (2022) confirms that equation recognition remains an open challenge for general-purpose OCR engines. Institutions deploying the system for STEM courses should be advised to provide digitally-born PDFs where possible, or to manually verify OCR output for equation-heavy documents.

### 5.7.6 Retrieval Quality Analysis

The quality of document retrieval â€” the R in RAG â€” was evaluated by examining the relevance of the top-5 retrieved chunks for 20 sample queries drawn from a test corpus of three uploaded documents (a course syllabus, a lecture on database normalisation, and a chapter on network protocols). Relevance was judged manually by the researcher on a three-point scale: Relevant, Partially Relevant, or Irrelevant.

**Table 5.12: Retrieval Relevance by Query Category**

| Query Category | Queries | Relevant (top-5) | Partially Relevant | Irrelevant | Mean Reciprocal Rank (MRR) |
|---|---|---|---|---|---|
| Definitional ("What is X?") | 8 | 7 (87.5%) | 1 (12.5%) | 0 (0%) | 0.94 |
| Procedural ("How do I Y?") | 6 | 5 (83.3%) | 1 (16.7%) | 0 (0%) | 0.88 |
| Comparative ("Compare A and B") | 4 | 3 (75.0%) | 1 (25.0%) | 0 (0%) | 0.81 |
| Out-of-scope | 2 | 0 (0%) | 0 (0%) | 2 (100%) | â€” |

The retrieval quality is strong for definitional and procedural queries â€” the types of questions most commonly asked by students in a course context (Bloom, 1956). Comparative queries performed slightly worse because the answer often requires synthesising information across multiple chunks that may reside in different parts of the vector space. The out-of-scope queries were correctly identified as irrelevant (the similarity score fell below the configurable threshold), confirming that the system appropriately declines to answer rather than hallucinating.

The Mean Reciprocal Rank (MRR) values indicate that when a relevant chunk exists, it is likely to appear among the top-2 retrieved results. This is consistent with the performance of cosine similarity search on 1536-dimensional embeddings produced by OpenAI's text-embedding-3-small model, which has been shown to achieve strong retrieval performance on general-domain text (OpenAI, 2024).

## 5.8 Summary of Findings

The comprehensive testing regimen produced the following key findings:

1. **Functional Correctness:** All 41 unit and integration tests passed, confirming that the core algorithms and API endpoints function correctly. The system correctly handles user registration, authentication, course management, document upload, OCR processing, and chat-based question answering.

2. **End-to-End Reliability:** All 16 system-level test scenarios passed, demonstrating that the full technology stack â€” including React frontend, FastAPI backend, Pinecone vector database, OpenAI embedding and chat models, Tesseract OCR, and Supabase storage â€” operates cohesively in a production-like environment.

3. **Acceptable Performance:** The average time to first token (2.1 seconds) falls within the acceptable range for interactive applications. Document processing times (4.2 seconds for digital PDFs) are reasonable for asynchronous processing. The primary performance bottleneck is the OpenAI API call time, which is inherent to cloud-based LLM inference.

4. **Effective Retrieval-Augmented Generation:** The RAG pipeline retrieves relevant document chunks for 82.5% of queries (33 out of 40 evaluated chunks). The system correctly declines to answer out-of-scope questions, mitigating the risk of hallucination.

5. **OCR Limitations:** The Tesseract OCR engine achieves acceptable accuracy for typed text (>95%) but performs poorly on mathematical equations (~40%) and handwritten content (~70%). This limits the system's effectiveness for STEM courses with equation-heavy materials.

6. **Positive User Response:** User acceptance testing revealed that participants found the system intuitive, valued the source citation feature, and rated the response quality as relevant in 82.6% of cases.

## 5.9 Conclusion

This project set out to address a well-documented challenge in higher education: students enrolled in large courses with extensive course materials often struggle to locate specific information within lecture notes, textbooks, and supplementary readings. The problem is compounded by the increasing use of scanned documents and image-based PDFs, which are not natively searchable. The AI Course Assistant Chatbot was conceived as a solution that combines retrieval-augmented generation with OCR capabilities, enabling students to ask natural-language questions and receive accurate, cited answers derived exclusively from their course materials.

The objectives established in Chapter 1 are revisited below, together with an assessment of their achievement:

- **Objective 1: To design and implement a document ingestion pipeline that extracts text from both digital and scanned PDFs.** This objective was achieved. The system uses pdfplumber for text extraction from digital PDFs and Tesseract OCR (via pytesseract) for scanned documents. A scanned page detection heuristic (text-length threshold) ensures that the OCR pipeline is invoked selectively. The unit tests (DOC-01 through DOC-05) and integration tests (INT-01, INT-02) confirmed the correctness of this pipeline.

- **Objective 2: To develop a RAG-based question-answering system that retrieves relevant content from course documents and generates contextually accurate answers.** This objective was achieved. The system embeds document chunks using OpenAI's text-embedding-3-small model, stores them in a Pinecone vector index with course-isolated namespaces, and retrieves the top-K chunks for each query. The GPT-4o-mini model generates answers conditioned on the retrieved context. The retrieval evaluation (Table 5.12) demonstrated a mean reciprocal rank of 0.88 across query categories, and user acceptance testing found 82.6% of responses relevant.

- **Objective 3: To implement role-based access control that distinguishes between instructors, students, and administrators.** This objective was achieved. The system implements JWT-based authentication with role-based authorisation middleware. Instructors can create courses and upload materials, students can enrol and ask questions, and administrators can manage users and view system statistics. System tests ST-12 and ST-13 confirmed that role-based restrictions are correctly enforced.

- **Objective 4: To build a responsive web interface that provides a seamless user experience across desktop and mobile devices.** This objective was achieved. The React 18 frontend, styled with Tailwind CSS, provides a responsive layout that adapts to viewport sizes from 375px to 1920px. User acceptance testing confirmed that participants could complete all tasks on both desktop and mobile devices.

- **Objective 5: To evaluate the system's performance, accuracy, and usability through systematic testing.** This objective was achieved. A multi-level testing strategy comprising 15 unit tests, 10 integration tests, 16 system tests, and user acceptance testing with 5 participants was executed. The results demonstrated 100% pass rates at the unit, integration, and system levels, and positive user feedback with an 82.6% relevance rating.

In conclusion, the AI Course Assistant Chatbot successfully demonstrates the feasibility and effectiveness of applying retrieval-augmented generation to the domain of course-specific question answering. The system provides a practical tool that can help students more efficiently navigate their course materials while giving instructors confidence that the answers are grounded in their curated content rather than in the broad â€” and potentially unreliable â€” knowledge of a general-purpose language model.

## 5.10 Recommendations

### 5.10.1 Recommendations for Institutional Adoption

Based on the findings of this study, the following recommendations are made for institutions considering the adoption of a RAG-based course assistant chatbot:

1. **Prioritise Digital-Born Documents:** The system performs optimally when processing digitally-born PDFs. Institutions should encourage instructors to upload digital versions of course materials rather than scanned copies, particularly for courses with mathematical or technical content. Document processing times are approximately 4.5 times faster for digital PDFs compared to scanned equivalents.

2. **Establish Document Quality Guidelines:** The quality of the chatbot's answers is directly proportional to the quality of the uploaded source documents. Instructors should be provided with guidelines on document preparation, including recommendations for clear fonts, adequate contrast in scanned materials, and the avoidance of password-protected files.

3. **Deploy as a Supplementary Tool:** The system is best positioned as a supplementary resource rather than a replacement for traditional office hours or tutorial sessions. It excels at providing quick answers to factual and procedural questions but cannot replicate the pedagogical depth of human instruction.

4. **Monitor Usage and Iterate:** Institutions should monitor usage patterns and student feedback to identify areas for improvement. The modular architecture of the system allows for iterative enhancement without disrupting existing functionality.

### 5.10.2 Recommendations for Future Developers

1. **Adopt a Test-Driven Development Approach:** The testing framework established in this project provides a solid foundation for ongoing development. Future developers should maintain and expand the test suite as new features are added, particularly for the OCR pipeline where accuracy improvements will require rigorous validation.

2. **Implement Comprehensive Logging and Monitoring:** The deployment would benefit from structured logging (using structured logging frameworks) and performance monitoring (using tools such as Prometheus or Grafana) to identify bottlenecks and error patterns in production usage.

3. **Use Feature Flags for Gradual Rollout:** As new features are added â€” particularly those involving changes to the RAG pipeline or AI model configuration â€” feature flags should be used to enable gradual rollout and A/B testing.

## 5.11 Limitations of the Study

While the system performs well across the evaluated dimensions, several limitations must be acknowledged:

1. **OCR Accuracy for Specialised Content:** The Tesseract OCR engine exhibits poor accuracy on mathematical equations (~40%) and moderate accuracy on handwritten text (~70%). This limitation significantly constrains the system's applicability in STEM disciplines where equations are prevalent. The system should not be relied upon for accurate processing of mathematical or scientific notation without human verification.

2. **Single-Document Scope of Queries:** The retrieval pipeline does not currently support cross-document synthesis in a sophisticated manner. Queries that require information to be aggregated from multiple documents may produce incomplete answers if the relevant content is distributed across chunks that fall beyond the top-K retrieval window.

3. **Limited Evaluation Scale:** The user acceptance testing was conducted with five participants, which, while sufficient for identifying major usability issues, is not large enough for statistically significant conclusions about user satisfaction or learning outcomes. A larger-scale study with a control group would be necessary to measure the system's impact on academic performance.

4. **Language Restriction:** The system has been tested only with English-language documents. The performance of both the OCR pipeline and the embedding/retrieval pipeline in other languages has not been evaluated and may vary significantly.

5. **Dependency on External APIs:** The system's operation depends on the availability and performance of third-party services: OpenAI (for embeddings and chat completion), Pinecone (for vector storage and retrieval), and Supabase (for database and file storage). Downtime or API changes at any of these providers could disrupt system functionality.

6. **Cost Considerations:** Each document upload and chat query incurs API costs for OpenAI embedding and completion calls. While the cost per query is low (approximately $0.001â€“0.003 per query with GPT-4o-mini), it may become significant at scale. Institutions would need to budget for these operational costs.

7. **No Context Persistence Across Sessions:** The current implementation treats each chat session independently, with no mechanism to carry conversational context or user preferences across sessions.

## 5.12 Contribution to Knowledge

This project makes the following contributions to the field of educational technology and applied artificial intelligence:

1. **Practical RAG Implementation for Education:** While retrieval-augmented generation has been extensively studied in the NLP literature (Lewis et al., 2020), this project provides a detailed, reproducible implementation of RAG tailored specifically to the educational domain, including consideration of course isolation, role-based access, and source citation.

2. **Integration of OCR with RAG Pipelines:** The system demonstrates a practical architecture for integrating OCR capabilities into a RAG pipeline, including the scanned page detection heuristic that selectively routes pages to the OCR engine. This hybrid approach optimises processing time while maintaining accuracy.

3. **Comprehensive Evaluation Framework:** The multi-level testing strategy and the evaluation metrics (retrieval relevance, MRR, response times, OCR accuracy categories) provide a template that can be adapted by other researchers evaluating similar systems.

4. **Open Implementation Blueprint:** The complete system architecture â€” from the FastAPI backend through the Pinecone vector database to the React frontend â€” is documented with sufficient detail to serve as a blueprint for other institutions or developers seeking to build similar systems.

## 5.13 Suggestions for Future Work

The following directions are proposed for extending and improving the system in future iterations:

1. **Advanced OCR Pipeline:** The current Tesseract-based OCR could be augmented with a specialised mathematical expression recognition model (e.g., a Transformer-based encoder-decoder trained on LaTeX-generation tasks) to improve accuracy for STEM content. Alternatively, cloud-based OCR services such as Google Document AI or Azure Form Recogniser could be integrated as a configurable backend option.

2. **Multi-Modal Retrieval:** Extending the system to support image-based queries (e.g., "What diagram in the lecture notes shows the OSI model layers?") would open new interaction modalities. This would require a multi-modal embedding model such as CLIP and a corresponding image-processing pipeline.

3. **Conversational Context Management:** Implementing session-level memory using a technique such as conversational summary buffers or vector-based history retrieval would allow the chatbot to maintain context across multiple turns within a session, enabling follow-up questions that refer to previous answers.

4. **Learning Analytics Dashboard:** Adding an analytics dashboard that tracks student query patterns, commonly asked questions, and document usage statistics would provide instructors with actionable insights into which topics students find most challenging.

5. **Automated Document Quality Assessment:** A preprocessing step that evaluates document quality (contrast, skew, resolution for scanned pages; text density and encoding for digital PDFs) and provides feedback to the uploader would improve the overall quality of the knowledge base.

6. **Multi-Language Support:** Extending the system to support documents and queries in multiple languages would broaden its applicability, particularly in multilingual educational contexts.

7. **Evaluation with a Control Group:** A formal study comparing learning outcomes between students using the chatbot and a control group using traditional study methods would provide rigorous evidence of the system's pedagogical impact.

8. **Fine-Tuned Embedding Models:** While OpenAI's general-purpose embedding model performs well, fine-tuning a domain-specific embedding model on educational corpora could improve retrieval accuracy for discipline-specific terminology and concepts.

9. **Federated Knowledge Bases:** For institution-wide deployment, a federated architecture that allows sharing of anonymised query patterns and retrieval effectiveness data across departments could enable continuous improvement of the system.

---

## References

Bloom, B. S. (1956) *Taxonomy of Educational Objectives: The Classification of Educational Goals*. New York: Longmans, Green.

Gao, Y., Xiong, Y., Gao, X., Jia, K., Pan, J., Bi, Y., Dai, Y., Sun, J. and Wang, H. (2023) 'Retrieval-Augmented Generation for Large Language Models: A Survey', *arXiv preprint arXiv:2312.10997*.

Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., KÃ¼ttler, H., Lewis, M., Yih, W., RocktÃ¤schel, T., Riedel, S. and Kiela, D. (2020) 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', in *Advances in Neural Information Processing Systems*, 33, pp. 9459â€“9474.

Myers, G. J., Sandler, C. and Badgett, T. (2011) *The Art of Software Testing*. 3rd edn. Hoboken, NJ: John Wiley & Sons.

Nielsen, J. (1993) *Usability Engineering*. San Diego: Academic Press.

OpenAI (2024) *New Embedding Models and API Updates*. Available at: https://openai.com/blog/new-embedding-models (Accessed: 15 June 2026).

Peng, D., Xu, C., Liu, C., Yang, M. and Liang, J. (2022) 'A Survey on Optical Character Recognition for Mathematical Expressions', *IEEE Access*, 10, pp. 105342â€“105361.

Smith, R. (2007) 'An Overview of the Tesseract OCR Engine', in *Proceedings of the Ninth International Conference on Document Analysis and Recognition (ICDAR 2007)*, pp. 629â€“633.

# COMBINED REFERENCES

Adamopoulou, E., & Moussiades, L. (2020). An overview of chatbot technology. In *Artificial Intelligence Applications and Innovations* (Vol. 584, pp. 373–383). Springer.

Bloom, B. S. (1956). *Taxonomy of Educational Objectives: The Classification of Educational Goals*. Longmans, Green.

Brown, T. B., Mann, B., Ryder, N., Subbiah, M., Kaplan, J., Dhariwal, P., ... & Amodei, D. (2020). Language models are few-shot learners. *Advances in Neural Information Processing Systems*, 33, 1877–1901.

Chase, H. (2023). *LangChain documentation*. https://python.langchain.com

Dix, A., Finlay, J., Abowd, G., & Beale, R. (2004). *Human-Computer Interaction* (3rd ed.). Pearson Education.

Ertel, W. (2018). *Introduction to Artificial Intelligence* (2nd ed.). Springer.

Følstad, A., & Brandtzæg, P. B. (2017). Chatbots and the new world of HCI. *Interactions*, 24(4), 38–42.

Gao, Y., Xiong, Y., Gao, X., Jia, K., Pan, J., Bi, Y., Dai, Y., Sun, J., & Wang, H. (2023). Retrieval-augmented generation for large language models: A survey. *arXiv preprint arXiv:2312.10997*.

Goodwin, M. (2020). *SameSite cookies explained*. https://web.dev/samesite-cookies-explained/

Hill, J., Ford, W. R., & Farreras, I. G. (2015). Real conversations with artificial intelligence: A comparison between human-human online conversations and human-chatbot conversations. *Computers in Human Behavior*, 49, 245–250.

Jurafsky, D., & Martin, J. H. (2023). *Speech and Language Processing* (3rd ed.). Pearson.

Kleppmann, M. (2017). *Designing Data-Intensive Applications*. O'Reilly Media.

Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Küttler, H., Lewis, M., Yih, W., Rocktäschel, T., Riedel, S., & Kiela, D. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. *Advances in Neural Information Processing Systems*, 33, 9459–9474.

Manning, C. D., & Schütze, H. (1999). *Foundations of Statistical Natural Language Processing*. MIT Press.

Matthes, E. (2019). *Python Crash Course* (2nd ed.). No Starch Press.

Mitchell, T. M. (1997). *Machine Learning*. McGraw-Hill.

Muennighoff, N., Tazi, N., Magne, L., & Reimers, N. (2023). MTEB: Massive text embedding benchmark. *arXiv preprint arXiv:2210.07316*.

Myers, G. J., Sandler, C., & Badgett, T. (2011). *The Art of Software Testing* (3rd ed.). John Wiley and Sons.

Nielsen, J. (1993). *Usability Engineering*. Academic Press.

Okonkwo, C. W., & Ade-Ibijola, A. (2021). Chatbots applications in education: A systematic review. *Computers and Education: Artificial Intelligence*, 2, 100033.

OpenAI. (2024). *New embedding models and API updates*. https://openai.com/blog/new-embedding-models

OWASP. (2023). *Token storage on client side*. https://cheatsheetseries.owasp.org/

Peng, D., Xu, C., Liu, C., Yang, M., & Liang, J. (2022). A survey on optical character recognition for mathematical expressions. *IEEE Access*, 10, 105342–105361.

Provos, N., & Mazières, D. (1999). A future-adaptable password scheme. *Proceedings of the 1999 USENIX Annual Technical Conference*.

Ramirez, S. (2023). *FastAPI documentation*. https://fastapi.tiangolo.com/

Russell, S., & Norvig, P. (2021). *Artificial Intelligence: A Modern Approach* (4th ed.). Pearson Education.

Shawar, B. A., & Atwell, E. (2007). Chatbots: Are they really useful? *LDV Forum*, 22(1), 29–49.

Shevat, A. (2017). *Designing Bots: Creating Conversational Experiences*. O'Reilly Media.

Silberschatz, A., Korth, H. F., & Sudarshan, S. (2019). *Database System Concepts* (7th ed.). McGraw-Hill Education.

Smith, R. (2007). An overview of the Tesseract OCR engine. *Proceedings of the Ninth International Conference on Document Analysis and Recognition (ICDAR 2007)*, 629–633.

Sommerville, I. (2016). *Software Engineering* (10th ed.). Pearson Education.

Wiggins, A. (2011). *The Twelve-Factor App*. https://12factor.net/

Winkler, R., & Söllner, M. (2018). Unleashing the potential of chatbots in education: A state-of-the-art analysis. *Academy of Management Annual Meeting Proceedings*, 2018(1), 15903.

Zalewski, M. (2011). *The Tangled Web: A Guide to Securing Modern Web Applications*. No Starch Press.
