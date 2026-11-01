---
title: 'Turing in a Box: Applying Artificial Intelligence as a Service to Targeted Phishing and Defending Against AI Generated Attacks'
draft: false
date: 2021-09-09 13:08:12-07:00
layout: meetings
params:
  event_date: 2021-10-19
  event_time_start: 6:00pm
  event_location: Online
  event_sponsors:
  - name: ForAllSecure
    logo: /images/red-logo.png
  event_speakers:
  - name: Eugene Lim
    title: Associate Cybersecurity Specialist, GovTech Singapore
    image: /images/eugene-lim.jpg
    description: Also known by his white hat handle @spaceraccoon, Eugene enjoys researching application security and devsecops. His work has been featured in newsletters such as Security Week and The Daily Swig.
  - name: Glenice Tan
    title: Associate Cybersecurity Specialist, GovTech Singapore
    image: /images/glenice-tan.jpg
    description: Glenice Tan is an associate cybersecurity specialist at GovTech Singapore who enjoys exploring the quirks of different systems, applications and processes. Currently, she is focusing on web security, cloud technology, and social engineering practices.
  - name: Tan Kee Hock
    title: Specialist
    image: /images/tan-kee-hock.png
    description: Tan Kee Hock is a specialist who simply likes to 'hack' things. He loves to play CTFs and is always keen to explore more!
  - name: Timothy Lee
    title: Associate Cyber Security Specialist
    image: /images/timothy-lee.jpg
    description: Timothy Lee is an associate cyber security specialist focusing on iOS security. As a certified OSWE, OSCP, and CRT, he has performed several security assessments, ranging from mobile and web application penetration tests to source code reviews. His main research area is on iOS kernel security.
---

With recent advances in next-generation language models such as OpenAI's GPT-3, AI generated text has reached a level of sophistication that matches or even exceeds human generated output. The proliferation of Artificial Intelligence as a Service (AIaaS) products places these capabilities in the hands of a global market, bypassing the need to independently train models or rely on open-source pre-trained models. By greatly reducing the barriers to entry, AIaaS gives consumers access to state-of-the-art AI capabilities at a fraction of the cost through user-friendly APIs.

In our research, we present a novel approach that uses AIaaS to improve the delivery of Red Team operations - in particular, the conduct of phishing campaigns. We developed a targeted phishing pipeline that uses OpenAI and Personality Analysis AIaaS products to generate persuasive phishing emails. Our pipeline automatically personalizes the content based on the target's background and personality. We observed that AI generated phishing content outperformed those that were manually created by Red Team operators. Furthermore, the pipeline freed up Red Team resources to focus on higher-value work such as context building and intelligence gathering.

In addition, we present an AIaaS-powered phishing defense framework to detect such attacks. Compared to traditional classification-based email filters, our framework adapts deep learning language models such as OpenAI's GPT-3 to accurately distinguish between AI and human generated text. This allows security teams to mount a credible defense against advanced AI text generators without requiring significant AI expertise or resources.

Our research provides actionable takeaways for both red and blue teams to prepare for the current reality of advanced AI proliferation. We discuss the long-term implications of this trend and recommend high-level strategies such as AI governance frameworks to safeguard against the abuse of AIaaS products.
