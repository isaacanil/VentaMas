// VentamaxLoader.js
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import React, { useRef } from "react";
import styled from "styled-components";

import logo from "./ventamax.svg";

// registra los plugins una sola vez
gsap.registerPlugin(SplitText);

const Wrapper = styled.div`
  position: fixed;
  inset: 0;
  background: #000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  user-select: none;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 3rem;
  font-weight: 800;
  color: #0090ff;          /* azul Ventamax */
  letter-spacing: 0.02em;
`;

const Subtitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 400;
  color: #d1d1d1;          /* gris suave */
  letter-spacing: 0.25em;
  text-transform: uppercase;
`;

export default function VentamaxLoader({ onFinish }) {
  const wrapper   = useRef(null);
  const logoRef   = useRef(null);
  const titleRef  = useRef(null);
  const subRef    = useRef(null);

  useGSAP(() => {
    // separa “Ventamax” en caracteres para el stagger
    const split = new SplitText(titleRef.current, { type: "chars" });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    /* 1️⃣ Fade‑in overlay */
    tl.from(wrapper.current, { autoAlpha: 0, duration: 0.4 });

    /* 2️⃣ Latido elástico del logo */
    tl.fromTo(
      logoRef.current,
      { scale: 0.85 },
      {
        scale: 1.4,
        duration: 0.9,
        yoyo: true,
        repeat: 1,
        ease: "elastic.out(1, 0.45)",
      },
      "<"
    );

    /* 3️⃣ “Ventamax” letra por letra */
    tl.from(
      split.chars,
      { yPercent: 120, opacity: 0, duration: 0.6, stagger: 0.04 },
      "+=0.2"
    );

    /* 4️⃣ Subtítulo “by gysys” */
    tl.from(subRef.current, { y: 20, opacity: 0, duration: 0.5 }, "-=0.35");

    /* 5️⃣ Desvanecimiento final */
    tl.to(wrapper.current, { 
      autoAlpha: 0, 
      duration: 0.5, 
      delay: 0.7,
      onComplete: onFinish,
    });

    // cleanup cuando el componente se desmonta
    return () => tl.revert();
  }, []);

  return (
    <Wrapper ref={wrapper}>
      <img ref={logoRef} src={logo} alt="Ventamax logo" width={120} />
      <Title ref={titleRef}>Ventamax</Title>
      <Subtitle ref={subRef}>by&nbsp;gysys</Subtitle>
    </Wrapper>
  );
}
