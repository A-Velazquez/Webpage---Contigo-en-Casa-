# Team AI Prompt & Audit Log
 
**Project Name:** Contigo en Casa   
**Team Members:** Santiago López Estrada, Adrián Isaac Velázquez Ramírez  
**SDG Goal Target:** Good Health and Well-being and Reduced Inequalities
 
---
 
## Week [1] Log Entry
*Duplicate this section for each week. If no AI was used this week, state: "No Generative AI was used in Week X."* 

### 1. High-Level Goal
*What feature, component, or bug were you trying to solve this week?*
* **Elements sharing the same space:** Making sure that two elements align alongside each other in the same width
 
### 2. The Interaction Log
*Document the primary prompts you used to generate the base code.*
If two elements are surrounded by divs, one containing a background image and text, and the other one text with a button. How can I make it so the second element doesn’t go to the next line?
 
| AI Tool Used | Exact Initial Prompt | What the AI Generated (Summary/Snippet) |
| :--- | :--- | :--- |
| *e.g., ChatGPT-4o* | *"Necesito que estos elementos al principio de una pagina están los dos un lado del otro y que llenen el ancho de la página"* | Generated full CSS structure (´/* Contenedor principal para alinearlos en fila */.hero-section {display: flex;width: 100%;flex-wrap: wrap; /* Permite que en pantallas pequeñas se apilen si es necesario */}/* Título (ahora ocupa el 60% del ancho) */#paginaTitulo {background-image:url("../images/imagenTituloFondo.jpg");background-repeat: no-repeat;background-size: cover;background-position: center;width: 60%;min-height: 500px; padding: 30px;box-sizing: border-box;}/* Estilo del texto del título */#tituloPagina {display: flex;justify-content: center;font-size: 56px;font-family: "Comic Papyrus", "Comic Sans MS", Papyrus, sans-serif;font-weight: bold;color: #1e3c5a;margin-top: 200px;margin-bottom: 20px;}/* Contenedor de donación (ahora ocupa el 40% para sumar 100% en total) */#contenedorDonacion {box-sizing: border-box;width: 40%;padding: 30px; /* Opcional: da espacio interno similar al título */
}´). |
 
### 3. The Human Audit & Modifications
*What did the AI get wrong or omit? What manual changes did you make to integrate this code into your existing application structure? (Write 2-3 sentences explaining your adjustments).*
* **What we changed/added:** The entire code proposed wasn’t necessary and some elements that were given, mainly the percentages of the width, we were having problems with so we changed them.
 
### 4. Integration & Learnings
*How does this code integrate with the rest of your system? What is the core mechanism you learned?*
* **Core Mechanics:** This is the first thing that user would see when entering the webpage, so it is really important to make a good first impression
 
### 5. Oral Defense Self-Check
- [X] We can explain every single line of this code.
- [X] We understand how the asynchronous operations/CSS classes used here affect other components.
- [X] We know exactly which file and line numbers this code is located in our repository.



### 1. High-Level Goal
*What feature, component, or bug were you trying to solve this week?*
* **Designing the core landing page (index.html) and the care video library (videoteca.html) for the "Contigo en Casa" project, integrating professional Google Fonts, Bootstrap components, responsive cards, icons, and contextual images.
 
### 2. The Interaction Log
*Document the primary prompts you used to generate the base code.*
 

AI Tool Used
Prompt
What the AI Generated
Gemini
"Recommend professional font pairings from Google Fonts for a healthcare and community social project landing page, and show me how to include them in HTML/CSS."
Suggested pairing Poppins for headers and Roboto for body text, along with standard HTML <link> elements to load them.
*Note: I used the link proportioned by AI to include them, but have not implemented them yet
Gemini
"What Bootstrap 5 components and utility classes can I use to build a clean video gallery layout with cards, badges, and responsive grid columns for mobile and desktop?"
Provided HTML structure utilizing Bootstrap cards, col-md-6 col-lg-4, custom badge styles, and image overlay wrapper classes.
Gemini
"Where can I source placeholder images or icons for a healthcare project, and how can I overlay a play button icon on top of a video thumbnail using Bootstrap and custom CSS?"
Suggested Unsplash stock image URLs for care contexts, Bootstrap Icons (bi-play-circle-fill), and a CSS absolute overlay layout using .play-overlay.


 
### 3. The Human Audit & Modifications
*What did the AI get wrong or omit? What manual changes did you make to integrate this code into your existing application structure? (Write 2-3 sentences explaining your adjustments).*
* **What we changed/added:** The AI-generated code included generic template text and placeholder links. I manually replaced all this to reflect the exact mission and context of INADEJ and the "Contigo en Casa" program. I also mapped out the actual relative navigation paths (./index.html, ./videoteca.html, ./appointment.html, ./donations.html)and implemented the css.
 
### 4. Integration & Learnings
*How does this code integrate with the rest of your system? What is the core mechanism you learned?*
* **Core Mechanics:** Core Mechanics: The user interface relies on Bootstrap's grid system and flexbox utilities to adapt across mobile and desktop screens. I practiced how to combine Bootstrap's responsive breakpoints with custom CSS positioning (position-relative and absolute overlays) to create interactive visual effects, like the hover dimming and play button overlay on video cards without breaking responsiveness. 
 
### 5. Oral Defense Self-Check
- [ x] We can explain every single line of this code.
- [ x] We understand how the asynchronous operations/CSS classes used here affect other components.
- [ xaaaa] We know exactly which file and line numbers this code is located in our repository.
