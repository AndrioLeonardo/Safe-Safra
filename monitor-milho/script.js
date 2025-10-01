// Espera o HTML ser totalmente carregado para executar o script
document.addEventListener('DOMContentLoaded', () => {

    // --- SELEÇÃO DOS ELEMENTOS DO HTML (DOM) ---
    const produtividadeEstimadaEl = document.getElementById('produtividade-estimada');
    const btnNovoRegistro = document.getElementById('btn-novo-registro');
    const listaRegistrosEl = document.getElementById('lista-registros');
    
    // Elementos do Modal
    const modal = document.getElementById('modal-registro');
    const formRegistro = document.getElementById('form-registro');
    const btnCancelar = document.getElementById('btn-cancelar');
    const tipoRegistroSelect = document.getElementById('tipo-registro');
    const secaoDiagnostico = document.getElementById('secao-diagnostico');
     const produtividadeToneladasEl = document.getElementById('produtividade-toneladas');

    // --- MINI BANCO DE DADOS DE DOENÇAS ---
    const DADOS_DOENCAS = [
        {
        id: 'ferrugem',
            nome: 'Ferrugem Comum',
            tratamento: 'Aplicação de fungicidas específicos (ex: Azoxistrobina) em estágios iniciais.',
            imagem_url: 'images/ferrugem.jpg', // Caminho local
            gatilho: 'folha' // Será acionado quando o usuário selecionar "Folha"
        },
        {
        id: 'cercosporiose',
            nome: 'Cercosporiose',
            tratamento: 'Uso de cultivares resistentes e fungicidas. Rotação de culturas ajuda na prevenção.',
            imagem_url: 'images/cercosporiose.jpg', // Caminho local
            gatilho: 'caule' // Será acionado quando o usuário selecionar "Caule"
        
        },

        {
        id: 'fusarium',
        nome: 'Podridão-da-espiga (Fusarium)',
        tratamento: 'Utilizar híbridos resistentes, rotação de culturas e garantir secagem rápida dos grãos após a colheita.',
        imagem_url: 'images/fusarium.jpg',
        gatilho: 'espiga' // O gatilho para a opção "Espiga"
    } // MAIS DOENÇAS PODEM SER ADICIONADAS
    ];

    // --- ESTADO DA APLICAÇÃO (DADOS) ---
    // Array que vai guardar todos os registros do diário
    let registrosDoDiario = [];

    let dadosDeClimaAtuais = null;



    // --- FUNÇÕES PRINCIPAIS ---

    // Função para renderizar (desenhar) os registros na tela
function renderizarRegistros() {
    // 1. Limpa a lista atual para não duplicar itens ao renderizar novamente
    listaRegistrosEl.innerHTML = '';

    // 2. Se não houver registros, mostra uma mensagem
    if (registrosDoDiario.length === 0) {
        listaRegistrosEl.innerHTML = '<p>Nenhum registro no diário ainda.</p>';
        return;
    }

    // 3. Passa por cada registro na nossa lista e cria o HTML para ele
    registrosDoDiario.forEach(registro => {
        const registroDiv = document.createElement('div');
        registroDiv.className = 'item-registro'; // Adiciona uma classe para o CSS

        // Formata a data para o padrão brasileiro (dd/mm/yyyy)
        const dataFormatada = new Date(registro.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

         const botaoExcluirHTML = `<button class="btn-excluir" data-id="${registro.id}">Excluir</button>`;

        // --- LÓGICA PARA EXIBIR O CLIMA NO CARD ---
        let climaHTML = '';
        if (registro.climaNoRegistro) {
            climaHTML = `<p><small><strong>Clima no dia:</strong> ${registro.climaNoRegistro.desc}, ${registro.climaNoRegistro.temp.toFixed(1)}°C</small></p>`;
        }

        if (registro.tipo === 'sintoma' && registro.doencaId) {
            // Se for um sintoma, procura as informações completas da doença no nosso "banco de dados"
            const doencaInfo = DADOS_DOENCAS.find(d => d.id === registro.doencaId);
            
            if (doencaInfo) {
                registroDiv.innerHTML = `
                    ${botaoExcluirHTML}
                    <h4>⚠️ Diagnóstico de Sintoma</h4>
                    <p><strong>Data:</strong> ${dataFormatada}</p>
                    <h3>${doencaInfo.nome}</h3>
                    <img src="${doencaInfo.imagem_url}" alt="Foto de ${doencaInfo.nome}" style="width: 300px; border-radius: 5px;">
                    <p><strong>Sugestão de Tratamento:</strong> ${doencaInfo.tratamento}</p>
                    <p><strong>Notas:</strong> ${registro.notas || 'Nenhuma nota'}</p>
                    ${climaHTML} 
                `;
            }
        } else {

            let infoPlantioHTML = '';
            // --- LÓGICA PARA EXIBIR OS DETALHES DO PLANTIO ---
            if (registro.tipo === 'plantio' && registro.area) {
                infoPlantioHTML = `
                    <p><strong>Área:</strong> ${registro.area} ha</p>
                    <p><strong>Estimativa Técnica:</strong> ${registro.produtividadeEsperada} sacas/ha</p>
                    <p><strong>Total Esperado:</strong> ${registro.totalEsperado.toFixed(0)} sacas</p>
                `;
            }
            // Cria o conteúdo HTML do card de registro
            registroDiv.innerHTML = `
                ${botaoExcluirHTML}
                <h4>${registro.tipo.charAt(0).toUpperCase() + registro.tipo.slice(1)}</h4>
                <p><strong>Data:</strong> ${dataFormatada}</p>
                <p><strong>Notas:</strong> ${registro.notas || 'Nenhuma nota'}</p>
                ${climaHTML} 
            `;
        }

        // 4. Adiciona o novo elemento HTML na página
        listaRegistrosEl.appendChild(registroDiv);
    });

    atualizarProdutividade();// Recalcula a produtividade sempre que a lista é atualizada

    }

    // Função para atualizar o cálculo da produtividade
function atualizarProdutividade() {
    let produtividadeBase = 0;
    const infoClimaEl = document.getElementById('info-clima');
    
    // 1. Encontra o registro de plantio para definir a produtividade base.
    const registroPlantio = registrosDoDiario.find(registro => registro.tipo === 'plantio');
    
    // Verifica se há um registro de plantio com área e produtividade esperada
    if (registroPlantio && registroPlantio.area > 0 && registroPlantio.produtividadeEsperada > 0) {
        // Usa o valor do registro em vez do número fixo 
        produtividadeBase = registroPlantio.area * registroPlantio.produtividadeEsperada;
    }

    // 2. Calcula os ajustes (bônus/penalidades) dos outros registros.
    let ajustes = 0;
    registrosDoDiario.forEach(registro => {
        switch (registro.tipo) {
            case 'fertilizacao':
                ajustes += 15;
                break;
            case 'sintoma':
                ajustes -= 25;
                break;
            case 'praga':
                ajustes -= 20;
                break;
        }
    });

    // 3. Lógica do clima
    let ajusteClima = 0;
    if (dadosDeClimaAtuais) {
        const condicao = dadosDeClimaAtuais.weather[0].main; // "Clear", "Rain", "Clouds"
        const desc = dadosDeClimaAtuais.weather[0].description;
        const temp = dadosDeClimaAtuais.main.temp;

        // Regra 1: Risco de Seca
        if (condicao === 'Clear' && temp > 28) {
            ajusteClima = -15;
        // Regra 2: Risco de Doenças (Fungos)
        } else if (condicao === 'Rain' && temp > 20) {
            ajusteClima = -20;
        // Regra 3: Clima Ideal
        } else if (condicao === 'Clouds' && temp > 15 && temp < 25) {
            ajusteClima = 5;
        }
        
        infoClimaEl.textContent = `Clima atual: ${desc}, ${temp.toFixed(1)}°C. Ajuste: ${ajusteClima} sacas.`;
    }

    // 4. Calcula o total e atualiza a tela.
    const produtividadeFinal = produtividadeBase > 0 ? produtividadeBase + ajustes + ajusteClima : 0;
    
    if (produtividadeBase === 0 && registrosDoDiario.length > 0 && !registroPlantio) {
        produtividadeEstimadaEl.textContent = 'Aguardando registro de plantio';
        produtividadeToneladasEl.textContent = ''; // Limpa o campo de toneladas
    } else {
        // Calcula o valor em toneladas (Total de Sacas * 60 kg/saca) / 1000 kg/tonelada
        const produtividadeEmToneladas = (produtividadeFinal * 60) / 1000;

        // Atualiza os dois campos na tela
        produtividadeEstimadaEl.textContent = `${produtividadeFinal.toFixed(0)} sacas no total`;
        produtividadeToneladasEl.textContent = `(Aprox. ${produtividadeEmToneladas.toFixed(2)} toneladas)`;
    }
}

    // Função para salvar os registros no localStorage
function salvarNoLocalStorage() {
    // O localStorage só armazena texto. Por isso, convertemos nosso array de objetos para uma string no formato JSON.
    localStorage.setItem('diario_milho_registros', JSON.stringify(registrosDoDiario));
}

    // Função para carregar os registros do localStorage
function carregarDoLocalStorage() {
    // Pegamos os dados salvos (que estão em formato de texto/JSON)
    const dadosSalvos = localStorage.getItem('diario_milho_registros');

    // Se existirem dados salvos, nós os transformamos de volta em um array de objetos e atualizamos nosso estado.
    if (dadosSalvos) {
        registrosDoDiario = JSON.parse(dadosSalvos);
    }
}

//---API do clima---
    async function buscarDadosDeClima() {
    const apiKey = '91c82b0a94c0bb8c6f844461304363fb'; // <-- IMPORTANTE: Chave de acesso da API
    const lat = -30.89; // Latitude de Santana do Livramento
    const lon = -55.53; // Longitude de Santana do Livramento
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        const response = await fetch(url);
        if (!response.ok) { // Verifica se a requisição foi bem sucedida
            throw new Error(`Erro na API: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Dados do clima recebidos:", data);
        return data;
    } catch (error) {
        console.error("Erro ao buscar dados do clima:", error);
        document.getElementById('info-clima').textContent = 'Não foi possível buscar o clima.';
        return null;
    }
}


    // --- EVENT LISTENERS (AÇÕES DO USUÁRIO) ---

    // Abre o modal quando o botão "Adicionar Registro" é clicado
    btnNovoRegistro.addEventListener('click', () => {
    // Procura pela opção 'Plantio' no select
    const plantioOption = tipoRegistroSelect.querySelector('option[value="plantio"]');

    // Verifica se já existe algum registro do tipo 'plantio' no nosso array de dados
    const jaExistePlantio = registrosDoDiario.some(registro => registro.tipo === 'plantio');

    // Se já existir um plantio, desabilita a opção e muda o texto
    if (jaExistePlantio) {
        plantioOption.disabled = true;
        plantioOption.textContent = 'Plantio (já registrado)';
    } else {
        // Se não existir, garante que a opção esteja habilitada e com o texto original
        plantioOption.disabled = false;
        plantioOption.textContent = 'Plantio';
    }

    // Garante que a primeira opção seja a de 'Selecione'
    tipoRegistroSelect.value = "";
        modal.style.display = 'block';
    });

    // Fecha o modal quando o botão "Cancelar" é clicado
    btnCancelar.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    //esconde a seção de diagnóstico baseado na seleção do tipo de registro
    tipoRegistroSelect.addEventListener('change', () => {
        const secaoDiagnostico = document.getElementById('secao-diagnostico');
    const secaoPlantio = document.getElementById('secao-plantio'); // Pega a nova seção

    // Esconde ambas as seções por padrão
    secaoDiagnostico.style.display = 'none';
    secaoPlantio.style.display = 'none';

    // Mostra a seção correta com base na seleção
    if (tipoRegistroSelect.value === 'sintoma') {
        secaoDiagnostico.style.display = 'block';
    } else if (tipoRegistroSelect.value === 'plantio') {
        secaoPlantio.style.display = 'block';
    }
    });

    // Lida com o envio do formulário
formRegistro.addEventListener('submit', (event) => {
    event.preventDefault(); // Impede o recarregamento da página

    // 1. Pega os valores dos campos do formulário
    const tipo = document.getElementById('tipo-registro').value;
    const data = document.getElementById('data-registro').value;

 // --- VALIDAÇÃO ---
    // Se o 'tipo' tiver o valor "" (nossa opção 'Selecione') ou a data estiver vazia, mostra um alerta e para a execução.
    if (!tipo || !data) {
        alert('Por favor, preencha o Tipo de Registro e a Data antes de salvar.');
        return; // Impede que o resto do código seja executado
    }


    const notas = document.getElementById('notas-registro').value;

    // 2. Cria um objeto para representar o novo registro
    const novoRegistro = {
        id: new Date().getTime(), // Cria um ID único baseado no tempo atual
        tipo: tipo,
        data: data,
        notas: notas
    };

    // --- Armazena o clima no registro ---
    if (dadosDeClimaAtuais) {
        novoRegistro.climaNoRegistro = {
            desc: dadosDeClimaAtuais.weather[0].description,
            temp: dadosDeClimaAtuais.main.temp
        };
    }

    // 3. Se o registro for um sintoma, o gatilho para o sitoma seleciona o sintoma a doença expecifica.
    if (tipo === 'sintoma') {
        // Pega o valor selecionado no campo "Local do Sintoma"
        const localSintoma = document.getElementById('local-sintoma').value;
        // Procura a doença que corresponde ao gatilho
        const doencaEncontrada = DADOS_DOENCAS.find(d => d.gatilho === localSintoma);
        if (doencaEncontrada) {
            novoRegistro.doencaId = doencaEncontrada.id;
        }
    }

     // ---  LÓGICA PARA O PLANTIO ---
    if (tipo === 'plantio') {
        const area = parseFloat(document.getElementById('area-plantada').value);
         const produtividadeEsperada = parseFloat(document.getElementById('produtividade-esperada').value);

        if (!isNaN(area) && area > 0 && !isNaN(produtividadeEsperada) && produtividadeEsperada > 0) {
            novoRegistro.area = area;
            novoRegistro.produtividadeEsperada = produtividadeEsperada; // Salvamos o novo valor
             // --- Calcula e armazena o total esperado no registro ---
            novoRegistro.totalEsperado = area * produtividadeEsperada;
        }
    }

    // 4. Adiciona o novo registro ao nosso array de dados
    registrosDoDiario.push(novoRegistro);

    salvarNoLocalStorage();// Salva a lista atualizada no localStorage

    console.log("Registro adicionado:", registrosDoDiario);

    // 5. Atualiza a tela para mostrar o novo registro
    renderizarRegistros();

    // 6. Esconde o modal e limpa o formulário para o próximo uso
    modal.style.display = 'none';
    formRegistro.reset();

    // Garante que as seções especiais sejam escondidas após o reset
    document.getElementById('secao-diagnostico').style.display = 'none';
    document.getElementById('secao-plantio').style.display = 'none';
});

// Adiciona um "ouvinte" na lista inteira para capturar cliques nos botões de excluir
listaRegistrosEl.addEventListener('click', (event) => {
    // Verifica se o elemento clicado foi um botão com a classe 'btn-excluir'
    if (event.target.classList.contains('btn-excluir')) {
        // Confirma com o usuário antes de apagar
        const confirmar = confirm('Tem certeza que deseja excluir este registro?');
        if (confirmar) {
            // Pega o ID do registro que está guardado no atributo 'data-id' do botão
            const idParaExcluir = parseInt(event.target.dataset.id);

            // Filtra o array, criando um novo array que contém todos os itens, EXCETO aquele com o ID que queremos excluir
            registrosDoDiario = registrosDoDiario.filter(registro => registro.id !== idParaExcluir);

            // Salva o novo estado (sem o item excluído) no localStorage
            salvarNoLocalStorage();

            // Renderiza a lista novamente para atualizar a tela
            renderizarRegistros();
        }
    }
});




// --- INICIALIZAÇÃO DA APLICAÇÃO ---
// Usamos uma função async auto-executável para poder usar 'await' na inicialização
(async () => {
    // Primeiro, busca os dados do clima e espera a resposta
    dadosDeClimaAtuais = await buscarDadosDeClima();
    
    // Depois, carrega os registros do usuário salvos no localStorage
    carregarDoLocalStorage();
    
    // Por fim, renderiza tudo na tela pela primeira vez
    renderizarRegistros();
})();

}); // Esta é a chave '});' que fecha o 'document.addEventListener('DOMContentLoaded', ...)' lá do topo do arquivo.