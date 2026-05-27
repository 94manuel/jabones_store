import { createCheckoutSignature, createEventChecksum } from './wompi-signature';

describe('Firmas Wompi', () => {
  it('genera la firma del checkout en el orden requerido', () => {
    expect(createCheckoutSignature('sk8-438k4-xmxm392-sn2m', 2490000, 'COP', 'prod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6'))
      .toBe('37c8407747e595535433ef8f6a811d853cd943046624a0ec04662b17bbf33bf5');
  });
  it('calcula el checksum dinámico del evento', () => {
    const data = { transaction: { id: '1234-1610641025-49201', status: 'APPROVED', amount_in_cents: 4490000 } };
    expect(createEventChecksum(data, ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'], 1530291411, 'prod_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z'))
      .toBe('5A18EC5E8FDB7DF463E9F94774CBA8F583BA21BD04A09CEFF2EA68A4BC0AEFBE');
  });
});
