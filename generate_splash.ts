import { GoogleGenAI } from "@google/genai";

async function generateSplashScreen() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `Uma tela de splash de aplicativo móvel para o "INCENDEIA CAPOEIRA", com um design rústico e de ação, sobreposto a um fundo fotográfico desfocado de uma floresta tropical densa e escura (selva). No canto superior direito, duas pequenas bandeiras nacionais empilhadas: a do Brasil em cima e a do Espanha embaixo.
Centralizado na parte superior, um emblema circular complexo de Fênix. A Fênix vermelha estilizada, voltada para a direita, tem asas em forma de escudos arqueados que incorporam as bandeiras nacionais: a bandeira do Brasil na asa esquerda e a bandeira da Espanha na asa direita. Silhuetas brancas de dois capoeiristas em movimento de luta (garrada e meia-lua de compasso) estão localizadas no peito do pássaro.
Abaixo do emblema, há um texto centralizado em grande destaque. O texto superior, "INCENDEIA", é grande, rústico e granulado, com cores mistas que remetem às bandeiras (vermelho, amarelo, verde, azul). Abaixo, em texto vermelho rústico ligeiramente menor, está "CAPOEIRA". Acima de "CAPOEIRA", há uma pequena faixa central com texto rústico menor, de difícil leitura, parecendo uma variante confusa e alterada de "ORDEM E PROGRESSO" com grafia ilegível.
Dois botões ovais horizontais centralizados estão localizados abaixo do texto principal. Ambos os botões têm uma textura de pedra rústica desgastada e avermelhada, lembrando rocha vulcânica. O botão superior contém o texto branco em negrito "MEMBROS". O botão inferior contém o texto branco em negrito "PAINEL ADM".
No rodapé da tela, há texto branco centralizado em duas linhas. A primeira linha diz "APP INCENDEIA 🔥 ON OFICIAL". A segunda linha, logo abaixo em texto menor, diz "Desenvolvido por Mestre Duende".
O design geral é limpo e dramático, com iluminação focada nos elementos centrais e uma estética de esporte de ação rústico e cultural. A paleta de cores é composta por tons terrestres da selva e as cores vibrantes e rústicas das bandeiras nacionais.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        console.log("IMAGE_DATA:" + part.inlineData.data);
      }
    }
  } catch (error) {
    console.error(error);
  }
}

generateSplashScreen();
