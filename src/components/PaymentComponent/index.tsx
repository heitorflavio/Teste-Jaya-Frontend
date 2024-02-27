'use client';
import React, { useState, ChangeEvent, useEffect } from "react";
import { initMercadoPago, getInstallments } from "@mercadopago/sdk-react";
import { createCardToken } from "@mercadopago/sdk-react/coreMethods";
import { InstallmentInterface } from "@/types/InstallmentInterface";
import { PayerInterface } from "@/types/PayerInterface";
import { CardInterface } from "@/types/CardInterface";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import axios from "axios";

export default function PaymentC() {
    const { data: session } = useSession();
    initMercadoPago(`${process.env.NEXT_PUBLIC_MP_KEY}`);

    const [payer, setPayerData] = useState<PayerInterface>({
        email: "",
        document: "",
        typeDocument: "CPF",
    });

    const [card, setCardData] = useState<CardInterface>({
        amount: "",
        numberCard: "",
        titleCard: "",
        monthExpiration: "",
        yearExpiration: "",
        cvv: "",
        installments: "1",
    });

    const handlePayerChange = (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>) => {
        const { id, value } = e.target;
        setPayerData({
            ...payer,
            [id]: value,
        });
    };

    const handleCardChange = (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>) => {
      const { id, value } = e.target;
      let newValue = value;
      if (id === "amount") {
        // Remover todos os caracteres exceto dígitos e pontos decimais
        newValue = value.replace(/[^\d.]/g, '');

        // Garantir que haja apenas um ponto decimal
        const dotCount = (newValue.match(/\./g) || []).length;
        if (dotCount > 1) {
            newValue = newValue.replace(/\./g, '');
        }

        // Garantir que há no máximo dois dígitos após o ponto decimal
        const parts = newValue.split('.');
        if (parts.length === 2 && parts[1].length > 2) {
            newValue = `${parts[0]}.${parts[1].slice(0, 2)}`;
        }
    }
    
      setCardData({
          ...card,
          [id]: newValue,
      });
    };

    const handleChange = (date: Date, type: string) => {
        if (type === "year") {
            const newDate = `${date.getFullYear()}`;
            setCardData({
                ...card,
                yearExpiration: newDate,
            });
        }
        if (type === "month") {
            const newDate = `${date.getMonth() + 1}`;
            setCardData({
                ...card,
                monthExpiration: newDate,
            });
        }
    };

    const [installment, setInstallment] = useState<any[] | undefined>([]);
    const [paymentMethodId, setPaymentMethodId] = useState<string | undefined>();

    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchInstallments = async () => {
            try {
                setLoading(true);
                const amount = card.amount;
                const trimmedCardNumber = card.numberCard.replace(/\s/g, "");

                if (trimmedCardNumber.length === 16) {
                    const bin = trimmedCardNumber.substring(0, 6);

                    const result = await getInstallments({
                        amount: amount,
                        locale: "pt-BR",
                        bin: bin,
                    });

                    if (Array.isArray(result)) {
                        const installment: InstallmentInterface[] = [];
                        result.forEach((item) => {
                            if (Array.isArray(item.payer_costs)) {
                                setPaymentMethodId(item.payment_method_id);

                                installment.push(
                                    ...item.payer_costs.map((cost: any) => ({
                                        installments: cost.installments,
                                        recommendedMessage: cost.recommended_message,
                                    }))
                                );
                            }
                        });

                        setInstallment(installment);
                    } else {
                        console.error(
                            "Invalid installments response:",
                            result
                        );
                    }
                } else {
                    console.error(
                        "Invalid card number length:",
                        trimmedCardNumber.length
                    );
                }
            } catch (error) {
                console.error("Error getting installments:", error);
            } finally {
                setLoading(false);
            }
        };

        if (card.amount && card.numberCard) {
            fetchInstallments();
        }
    }, [card.amount, card.numberCard]);

    const createToken = async (
        card: CardInterface,
        payer: PayerInterface
    ): Promise<string | undefined> => {
        try {
            const cardToken = await createCardToken({
                cardNumber: card.numberCard.replace(/\s/g, ""),
                cardholderName: card.titleCard,
                cardExpirationMonth: card.monthExpiration,
                cardExpirationYear: card.yearExpiration,
                securityCode: card.cvv,
                identificationType: payer.typeDocument,
                identificationNumber: payer.document,
            });
            return cardToken?.id;
        } catch (error) {
            console.error("Error generating token:", error);
            return undefined;
        }
    };

    const sendPayment = async (dataToSend: any) => {
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}`, dataToSend, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${(session as any)?.token}`,
                },
            });
            toast.success("Pagamento realizado com sucesso!");
            return response;
        } catch (error: any) {
            console.error("Error when making request to the backend:", error);
            toast.error("Erro ao realizar pagamento!");
            if (error.response.data['payer.identification.number']) {
                toast.error('Número de CPF inválido!');
            }
            
            return error;
        }
    };

    const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const tokenCard = await createToken(card, payer);

        if (!tokenCard) {
            console.error("Error, creating card token.");
            return;
        }

        const dataToSend = {
            transaction_amount: parseFloat(card.amount),
            installments: parseInt(card.installments),
            token: tokenCard,
            payment_method_id: paymentMethodId,
            payer: {
                email: payer.email,
                identification: {
                    type: payer.typeDocument,
                    number: payer.document,
                },
            },
        };

        sendPayment(dataToSend);
    };

    return (
        <div className="flex justify-center mt-8">
            <div className="max-w-8xl w-full sm:mx-auto p-6">
                <div className="bg-white  p-8 border rounded ">
                    <form onSubmit={handlePayment}>
                        <div className="flex flex-col sm:flex-row">
                            <div className="p-0 lg:p-8 mb-4 sm:mb-0 sm:mr-4 sm:w-1/2">
                                <h2 className="text-xl mb-4">Dados do Pagador</h2>
                                <div className="mb-4">
                                    <input
                                        onChange={handlePayerChange}
                                        value={payer.email}
                                        id="email"
                                        required
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        type="email"
                                        placeholder="Email Dados do Pagador"
                                    />
                                </div>
                                <div className="mb-4">
                                    <select
                                        onChange={handlePayerChange}
                                        value={payer.typeDocument}
                                        id="typeDocument"
                                        required
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    >
                                        <option value="CPF">CPF</option>
                                        <option value="CNPJ">CNPJ</option>
                                    </select>
                                </div>

                                <div className="mb-6">
                                    <input
                                        onChange={handlePayerChange}
                                        value={payer.document}
                                        id="document"
                                        required
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        type="text"
                                        placeholder="Número de identificação"
                                    />
                                </div>
                            </div>
                            <div className="p-0 lg:p-8 sm:w-1/2">
                                <h2 className="text-xl mb-4">Dados do Pagamento</h2>
                                <div className="mb-4">
                                    <label
                                        className="block text-gray-700 text-sm font-bold mb-2"
                                        htmlFor="valor"
                                    >
                                        Valor do Pagamento
                                    </label>
                                    <input
                                        onChange={handleCardChange}
                                        value={card.amount}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        id="amount"
                                        type="text"
                                        required
                                        placeholder="Exemplo 100.00"
                                        name="amount"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label
                                        className="block text-gray-700 text-sm font-bold mb-2"
                                        htmlFor="numero_cartao"
                                    >
                                        Número do Cartão
                                    </label>
                                    <input
                                        onChange={handleCardChange}
                                        value={card.numberCard}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        id="numberCard"
                                        type="text"
                                        required
                                        placeholder="Número do Cartão"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label
                                        className="block text-gray-700 text-sm font-bold mb-2"
                                        htmlFor="nome_titular"
                                    >
                                        Nome do Titular
                                    </label>
                                    <input
                                        onChange={handleCardChange}
                                        value={card.titleCard}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        id="titleCard"
                                        type="text"
                                        required
                                        placeholder="Nome do Titular"
                                    />
                                </div>
                                <div className="flex flex-col mb-4">
                                    <div className="mb-4">
                                        <label
                                            className="block text-gray-700 text-sm font-bold mb-2"
                                            htmlFor="mes_expiracao"
                                        >
                                            Mês de Expiração
                                        </label>
                                        <DatePicker
                                            dateFormat="MM"
                                            showMonthYearPicker
                                            showFullMonthYearPicker
                                            onChange={(date: Date) => {
                                                handleChange(date, "month");
                                            }}
                                            selected={
                                                card.monthExpiration
                                                    ? new Date(`${card.monthExpiration}`)
                                                    : new Date(`${new Date().getMonth() + 10}`)
                                            }
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            id="monthExpiration"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label
                                            className="block text-gray-700 text-sm font-bold mb-2"
                                            htmlFor="ano_expiracao"
                                        >
                                            Ano de Expiração
                                        </label>
                                        <DatePicker
                                            dateFormat="yyyy"
                                            showYearPicker
                                            onChange={(date: Date) => {
                                                handleChange(date, "year");
                                            }}
                                            selected={
                                                card.yearExpiration
                                                    ? new Date(`${Number(card.yearExpiration) + 1}`)
                                                    : new Date(`${new Date().getFullYear() + 2}`)
                                            }
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            id="yearExpiration"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label
                                        className="block text-gray-700 text-sm font-bold mb-2"
                                        htmlFor="cvv"
                                    >
                                        CVV
                                    </label>
                                    <input
                                        onChange={handleCardChange}
                                        value={card.cvv}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        id="cvv"
                                        type="text"
                                        required
                                        placeholder="CVV"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label
                                        className="block text-gray-700 text-sm font-bold mb-2"
                                        htmlFor="parcelas"
                                    >
                                        Selecione o número de Parcelas
                                    </label>
                                    <select
                                        onChange={handleCardChange}
                                        value={card.installments}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        id="installments"
                                        required
                                    >
                                        {installment && installment.length > 0 ? (
                                            installment.map((option, index) => (
                                                <option key={index} value={option.installments}>
                                                    {option.recommendedMessage}
                                                </option>
                                            ))
                                        ) : (
                                            <option disabled value="">
                                                Sem opções de parcelamento disponíveis
                                            </option>
                                        )}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center flex-wrap -mx-4 mt-8">
                            <button
                                type="submit"
                                className="bg-green-500 w-full hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Pagar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
